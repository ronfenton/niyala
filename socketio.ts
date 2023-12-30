import { Server } from 'socket.io';
import { config as dotenv } from 'dotenv';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Socket } from 'socket.io-client';

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
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    ioConsole.log('Client connected');
    socket.join('messageRoom');
    socket.emit('message', 'Hello from SocketIO Server');

    socket.on('message', (data) => {
      ioConsole.log(`Message received: ${data}`);
      socket.emit('message', `Message (${data}) received; send another?`);
      socket.broadcast.to('messageRoom').emit('message', 'Other client sent '+data);
    });
  });

  globalSocketIO.server = io;
  ioConsole.log('Server created on port 3001');
  return globalSocketIO.server;
};
