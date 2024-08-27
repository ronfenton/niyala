import { Server } from 'socket.io';
import { config as dotenv } from 'dotenv';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Socket } from 'socket.io-client';
import { createCharacter, getByID, handleAction, subscribeHandler } from './characterApp/app';
import { Environment, PrompterSettings } from './characterApp/types';

dotenv();

const globalSocketIO = global as unknown as { server: Server };

const logTime = ():string => {
  const now = new Date();
  return `[${now.getUTCHours()}:${now.getUTCMinutes()}:${now.getUTCSeconds()}]`;
};

export const ioConsole = {
  log: (s:string):void => console.log(`${logTime()} INFO (socket.io) ${s}`),
};

export const getGlobalIO = async () => {

  if (globalSocketIO.server) {
    return globalSocketIO.server;
  }
  const io = new Server(3001, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SERVER_URL,
      methods: ['GET', 'POST'],
    },
  });

  if(process.env.SOCKETIO_DEBUG === '1') {
    io.of('/').adapter.on('create-room', (room) => {
      console.log(`Room \x1b[32m${room}\x1b[0m created`);
    });
    io.of('/').adapter.on('join-room', (room, id) => {
      console.log(`User \x1b[31m${id}\x1b[0m joined room \x1b[32m${room}\x1b[0m`);
    });
    io.of('/').adapter.on('delete-room', (room) => {
      console.log(`Room \x1b[32m${room}\x1b[0m deleted`);
    });
    io.of('/').adapter.on('leave-room', (room, id) => {
      console.log(`User \x1b[31m${id}\x1b[0m left room \x1b[32m${room}\x1b[0m`);
    });
  }

  io.on('connection', (socket) => {
    ioConsole.log('Client connected');
    socket.join('messageRoom');
    socket.emit('message', 'Hello from SocketIO Server');

    socket.on('message', (data) => {
      ioConsole.log(`Message received: ${data}`);
      socket.emit('message', `Message (${data}) received; send another?`);
      socket.broadcast.to('messageRoom').emit('message', 'Other client sent '+data);
    });

    socket.on('create_req', (payload) => {
      handleAction(payload.id,'',servEnv.prompter,'create',null)
      socket.join(payload.id)
      socket.emit('state_opened', {state:getByID(payload.id).state,id:payload.id})
    })
    socket.on('open_req', (payload) => {
      ioConsole.log(`Character ${payload.id} requesting load from websocket`);
      socket.join(payload.id);
      socket.emit(`state_opened`, {state:getByID(payload.id).state,id:payload.id})
    }) 
    socket.on('close', (data) => {
      socket.leave(data.id)
    })
  });

  globalSocketIO.server = io;
  ioConsole.log('Server created on port 3001');
  return globalSocketIO.server;
};

const charSheetEventHandler = (charID:string, data:{event: string, payload: any}) => {
  if(data.event == 'State Change') {
    globalSocketIO.server.to(charID).emit(`state_changed`,{state:data.payload,id:charID})
  }
}

subscribeHandler(charSheetEventHandler)

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
  ruleset: undefined
}