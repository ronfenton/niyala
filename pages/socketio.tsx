import React from 'react'
import { io } from 'socket.io-client'

const SocketIOPage = () => {
  const socket = io(':3001')
  const [isConnected,setIsConnected] = React.useState(socket.connected)
  
  return <div>
    <InputChatter socket={socket}/>
  </div>
}

const InputChatter:React.FC<{socket}> = ({socket}) => {
  const [state,setState] = React.useState("Waiting")
  socket.on('message',setState)
  const submit = () => socket.emit('message',state)
  return <div>
    <textarea value={state} onChange={(e) => setState(e.target.value)}/> <button onClick={submit}>Send</button>
  </div>
}

export default SocketIOPage