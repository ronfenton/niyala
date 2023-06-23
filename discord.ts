import { Client, REST, Routes, Events, GatewayIntentBits, Interaction, TextChannel } from 'discord.js';
import { config as dotenv } from 'dotenv';
import { generate } from './pages/api/randomBackground';

dotenv()

const globalDiscord = global as unknown as { client: Client }

export const getGlobalDiscord = async () => {
  if (globalDiscord.client) {
    return globalDiscord.client
  }
  const client = new Client({ intents: [GatewayIntentBits.Guilds]})
  setupSlashCommands()
  client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag} at ${new Date().toTimeString()}`)
  })
  client.on(Events.InteractionCreate, handleInteraction)
  client.login(process.env.DISCORD_TOKEN)

  globalDiscord.client = client
  console.log("Discord Client created");
  return globalDiscord.client
}

export const sendMessage = async (channel:string,message:string) => {
  const client = await getGlobalDiscord()
  const c = client.channels.cache.get(channel) as TextChannel
  c.send(message)
}

const setupSlashCommands = async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');
  
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: discordCommands });
  
    console.log('Successfully reloaded application (/) commands.');
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