import { Client, REST, Routes, Events, GatewayIntentBits, Interaction, TextChannel, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config as dotenv } from 'dotenv';
import { generate } from './pages/api/randomBackground';
import { handleAction as handleCSAction, printDebug as printCSDebug, getByID, subscribeHandler } from './characterApp/app';
import { Attribute, Character, Environment, PrompterSettings, Identity } from './characterApp/types';
import { whatIs, WhatIsDefinition } from './pages/api/whatis';
import { Type as DefinitionType } from './collections/Definition'

dotenv();

const globalDiscord = global as unknown as { client: Client }

export const getGlobalDiscord = async () => {
  if (globalDiscord.client) {
    return globalDiscord.client
  }
  const client = new Client({ intents: [GatewayIntentBits.Guilds]})
  setupSlashCommands()
  client.once(Events.ClientReady, c => {
    discordConsole.log(`Ready! Logged in as ${c.user.tag} at ${new Date().toTimeString()}`)
  })
  client.on(Events.InteractionCreate, handleInteraction)
  client.login(process.env.DISCORD_TOKEN)

  globalDiscord.client = client
  discordConsole.log("Discord Client created");
  return globalDiscord.client
}

const logTime = ():string => {
  const now = new Date()
  return `[${now.getUTCHours()}:${now.getUTCMinutes()}:${now.getUTCSeconds()}]`
}

export const discordConsole = {
  log: (s:string) => console.log(`${logTime()} \x1b[32mINFO\x1b[0m (\x1b[34mdiscord\x1b[0m): ${s}`)
}

export const sendMessage = async (channel:string,message:string) => {
  const client = await getGlobalDiscord()
  const c = client.channels.cache.get(channel) as TextChannel
  c.send(message)
}

const setupSlashCommands = async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    discordConsole.log('Started refreshing application (/) commands.');
  
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: [...discordCommands,...charsheetcommands] });
  
    discordConsole.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(JSON.stringify(error,null,2));
  }
}
const discordCommands = [
  {
    name: "random-background",
    description: "Generate a random background for a Megastructure B7 Resident.",
  },
  new SlashCommandBuilder()
  .setName('what-is')
  .setDescription('Retrieves the definition of a given term')
  .addStringOption(option => option.setName('search_term').setDescription('Character ID').setRequired(true))
  .addBooleanOption(option => option.setName('public').setDescription('Post definition publically?').setRequired(false))
]

const charSheetEventHandler = (charID:string, data:{event: string, payload: any}) => {
  if(data.event == 'State Change') {
    return;
  }
  const channel = globalDiscord.client.channels.cache.get('1120775031564275804') as TextChannel
  channel.send(`${charID}: ${JSON.stringify(data)}`)
}

subscribeHandler(charSheetEventHandler)

const charsheetcommands = [
  new SlashCommandBuilder()
  .setName('debug')
  .setDescription('debug commands for development')
  .addSubcommand(subcommand => 
    subcommand
      .setName('print')
      .setDescription('exports current memory')),
  new SlashCommandBuilder ()
  .setName('character')
  .setDescription('Manipulate a character')
  .addSubcommand(subcommand => 
    subcommand
      .setName('insert-attribute')
      .setDescription('Inserts a new attribute')
      .addStringOption(option => option.setName('name').setDescription('Attribute name').setRequired(true))
      .addNumberOption(option => option.setName('base').setDescription('Attribute base').setRequired(true))
      .addNumberOption(option => option.setName('perlvl').setDescription('Per Lvl Cost').setRequired(true))
      .addStringOption(option => option.setName('char_id').setDescription('Character ID').setRequired(true)))
  .addSubcommand(subcommand => 
    subcommand
    .setName('create')
    .setDescription('Creates a new blank character')
    .addStringOption(option => option.setName('id').setDescription('set a custom ID (DEBUGGING)')))
  .addSubcommand(subcommand =>
    subcommand
    .setName('get')
    .setDescription('Retrieve information for a given character')
    .addStringOption(option => option.setName('id').setDescription('The ID of the requested character').setRequired(true)))
]

const handleDiscordActions2 = async (i:Interaction) => {
  if(!i.isChatInputCommand()) {
    return;
  }
  try {
    if(i.commandName === 'debug' && i.options.getSubcommand(true) === 'print') {
      const data = await printCSDebug()
      i.editReply(`\`\`\`js\n${data}\`\`\``)
      return;
    }
    if(i.commandName === 'character') {
      const actionID = i.options.getSubcommand(true)
      switch (actionID) {
        case `insert-attribute`: {
          const name = i.options.getString('name')
          const base = i.options.getNumber('base')
          const perLvl = i.options.getNumber('perlvl')
          const charID = i.options.getString('char_id')
          const newAttr: Partial<Attribute> = {
            name,
            levelMap: {perLvl},
            base
          }
          const resp = handleCSAction(charID,'',servEnv.prompter,actionID,newAttr)
          i.editReply(resp)
          break;
        }
        case 'create': {
          const charID = i.options.getString('id')
          const resp = handleCSAction(charID || 'temp','',servEnv.prompter,'create',null)
          i.editReply(resp)
          break;
        }
        case 'get': {
          const charID = i.options.getString('id')
          const char = getByID(charID)
          i.editReply({embeds:[CharStateToEmbed(char.state.character)]})
          break;
        }
      }
    }
  } catch (e) {
    i.editReply(`Breaking error: ${e}`)
  }
}

const toEmbed = (data: WhatIsDefinition) => {
  let newEmbed = new EmbedBuilder()
    .setTitle(data.term)
    .setDescription(data.description)
  
  data.otherTerms !== undefined ? newEmbed.addFields({name: 'Other terms', value: data.otherTerms.join(', ')}) : {}
  data.linkedArticle !== undefined ? newEmbed.addFields({name: 'Linked Article', value: `[${data.linkedArticle.title}](${data.linkedArticle.url})`}) : {}
  return newEmbed
}

const handleInteraction = async (i:Interaction) => {
  if (!i.isChatInputCommand()) { return; }

  await i.deferReply();

  try {
    switch(i.commandName) {
      case "random-background": 
        await i.editReply(generate())
        break;
      case "what-is":
        await i.editReply({ embeds: [toEmbed(await whatIs(i.options.getString('search_term')))]})
      case 'debug': 
        await handleDiscordActions2(i);
        break;
      case 'character': 
        await handleDiscordActions2(i);
        break;
      default:
        await i.editReply(`Unhandled command: ${i.commandName}`)
        break;
    }
  } catch (e) {
    console.error(`Discord error: ${e.message}`)
    i.editReply(`This interaction failed - talk to Dingo and tell him what you were doin.`)
  }
}

export const DiscordLogger = {
  debug: (x:string) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send({content:`Debug: ${x}`})),
  log: (x:string) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send({content:`Log: ${x}`})),
  warn: (x: string) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send({content:`Warn: ${x}`})),
  error: (x: string) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send({content:`ERROR: ${x}`})),
  fatal: (x: string) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send({content:`FATAL: ${x}`})),
}

const CharStateToEmbed = (c:Character) => {
  const embed = new EmbedBuilder()
    .setTitle(c.id)
    .setDescription('Character info for your character')
    .addFields(
      { name: 'Attributes' , value : Object.entries(c.characteristics.attributes).map(([,a]:[undefined,Attribute]) => `${a.abbreviation || a.name}: ${a.lvl}`).join(`\n`)}
    )
  return embed
}

const servEnv:Environment = {
  logger: {
    debug: function (x: string): void {
      throw new Error('Function not implemented.');
    },
    log: function (x: string): void {
      throw new Error('Function not implemented.');
    },
    warn: function (x: string): void {
      throw new Error('Function not implemented.');
    },
    error: function (x: string): void {
      throw new Error('Function not implemented.');
    },
    fatal: function (x: string): void {
      throw new Error('Function not implemented.');
    }
  },
  prompter: {
    bool: function (context: PrompterSettings): boolean {
      throw new Error('Function not implemented.');
    },
    number: function (context: PrompterSettings): number {
      throw new Error('Function not implemented.');
    },
    text: function (context: PrompterSettings): string {
      throw new Error('Function not implemented.');
    },
    select: function (context: PrompterSettings, options: string[], defaultSelect: string): string {
      throw new Error('Function not implemented.');
    }
  },
}