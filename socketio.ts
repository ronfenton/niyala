import { Server } from "socket.io"
import { config as dotenv } from "dotenv"

dotenv()

const globalSocketIO = global as unknown as { server: Server }

export const getGlobalIO = async () => {
  if (globalSocketIO.server) {
    return globalSocketIO.server
  }
  const io = new Server(3001,{
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET','POST']
    }
  })

  io.on('connection', (socket) => {
    ioConsole.log('Client connected')
    socket.join('messageRoom')
    socket.emit('message', 'Hello from SocketIO Server')

    socket.on('message', (data) => {
      ioConsole.log(`Message received: ${data}`);
      socket.emit('message', `Message (${data}) received; send another?`)
    })
  })
  
  globalSocketIO.server = io
  ioConsole.log(`Server created on port 3001`);
  return globalSocketIO.server
}

const logTime = ():string => {
  const now = new Date()
  return `[${now.getUTCHours()}:${now.getUTCMinutes()}:${now.getUTCSeconds()}]`
}

export const ioConsole = {
  log: (s:string) => console.log(`${logTime()} INFO (socket.io) ${s}`)
}