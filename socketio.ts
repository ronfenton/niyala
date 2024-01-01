import { Server } from 'socket.io';
import { config as dotenv } from 'dotenv';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Socket } from 'socket.io-client';
import { socketIOSetup } from './characterApp/app';

dotenv();

const globalSocketIO = global as unknown as { server: Server };

const logTime = ():string => {
  const now = new Date();
  return `[${now.getUTCHours()}:${now.getUTCMinutes()}:${now.getUTCSeconds()}]`;
};

export const ioConsole = {
  log: (s:string):void => console.log(`${logTime()} INFO (socket.io) ${s}`),
};

type testState = {
  lastEdit: Date;
  stringVal: string;
};

const states = new Map<string, testState>();


export const getGlobalIO = async () => {

  if (globalSocketIO.server) {
    return globalSocketIO.server;
  }
  const io = new Server(3001, {
    cors: {
      origin: 'http://localhost:3000',
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

    socketIOSetup(socket)
  });

  globalSocketIO.server = io;
  ioConsole.log('Server created on port 3001');
  return globalSocketIO.server;
};
