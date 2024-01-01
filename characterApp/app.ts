import { Interaction } from 'discord.js';
import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { getGlobalIO } from '../socketio'

type testState = {
  lastEdit: Date;
  stringVal: string;
};

const states = new Map<string, testState>();

const discordIOSetup = (
  discordClient: any
) => {

}

const handleDiscordActions = async (i:Interaction) => {
  if (!i.isChatInputCommand()) { return; }
  if(i.commandName !== 'debug') { return ;}
  switch(i.options.getSubcommand(true)){
    case 'list-memory': await i.reply(states.size === 0 ? 'Nothing in memory' : [...states.entries()].map(([k,v]) => `**${k}:** ${v.stringVal}`).join('\n')); break;
    case 'set': {
      const state = i.options.getString('state')
      const value = i.options.getString('value')
      states.set(state,{lastEdit:new Date(),stringVal:value})
      const server = await getGlobalIO()
      server.to(state).emit('state changed', { stateKey: state, stringVal: value })
      i.reply('State changed.')
      return;
    }
    default: await i.reply('holding');
  }
}

const socketIOSetup = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
) => {
  socket.on('open state', (stateKey: string) => {
    console.log(`${socket.id} opened ${stateKey}`)
    socket.join(stateKey);
    if (states.get(stateKey) === undefined) {
      states.set(stateKey, { lastEdit: new Date(), stringVal: 'New Document' });
    }
    socket.emit('state opened', { stateKey, stringVal: states.get(stateKey).stringVal })
  });
  socket.on('set state', (data:{stateKey:string,stringVal:string}) => {
    console.log(`${socket.id} set ${data.stateKey} to ${data.stringVal}`)
    states.set(data.stateKey,{stringVal:data.stringVal,lastEdit: new Date()})
    socket.broadcast.to(data.stateKey).emit('state changed', data)
  })
  socket.on('close state', (stateKey: string) => {
    console.log(`${socket.id} closed ${stateKey}`)
    socket.leave(stateKey)
  })
};

export { socketIOSetup, handleDiscordActions }