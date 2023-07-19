import { Client, REST, Routes, Events, GatewayIntentBits, Interaction, TextChannel } from 'discord.js';
import { config as dotenv } from 'dotenv';
import { generate } from './pages/api/randomBackground';

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
  log: (s:string) => console.log(`${logTime()} INFO (discord): ${s}`)
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
  
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: discordCommands });
  
    discordConsole.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(JSON.stringify(error,null,2));
  }
}
const discordCommands = [
  {
    name: "random-background",
    description: "Generate a random background for a Megastructure B7 Resident",
  }
]

const handleInteraction = async (i:Interaction) => {
  if (!i.isChatInputCommand()) { return; }

  switch(i.commandName) {
    case "random-background": 
      await i.reply(generate())
      break;
    default:
      await i.reply('Unknown Command')
      break;
  }
}

export const DiscordLogger = {
  debug: (x:string) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send({content:`Debug: ${x}`})),
  log: (x:string) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send({content:`Log: ${x}`})),
  warn: (x: string) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send({content:`Warn: ${x}`})),
  error: (x: string) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send({content:`ERROR: ${x}`})),
  fatal: (x: string) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send({content:`FATAL: ${x}`})),
}