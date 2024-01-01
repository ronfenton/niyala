import React from 'react'
import { io } from 'socket.io-client'
import _ from 'lodash/fp'

const SocketIOPage = () => {
  const socket = io(':3001')
  const [isConnected,setIsConnected] = React.useState(socket.connected)
  
  return <div>
    <InputChatter socket={socket}/>
    <RoomTester socket={socket}/>
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

const RoomTester:React.FC<{socket}> = ({socket}) => {
  const [states,setStates] = React.useState({} as {[str:string]: string})
  const [inputRoom,setInputRoom] = React.useState('defaultRoom')
  socket.on('state changed', (data:{stateKey:string,stringVal:string}) => {
    setStates({...states,[data.stateKey]:data.stringVal});
  })
  socket.on('state opened', (data:{stateKey:string,stringVal:string}) => {
    console.log(data)
    setStates({...states,[data.stateKey]:data.stringVal});
    console.log(states)
  })
  socket.on('state closed', (stateKey) => setStates(_.omit([stateKey])(states)));
  const openRoom = () => {
    socket.emit('open state', inputRoom)
  }
  const changeVal = (stateKey) => {
    const res = prompt(`Change ${stateKey} to...`, states[stateKey])
    if(res !== undefined) {
      socket.emit('set state',{stateKey,stringVal:res})
      setStates({...states,[stateKey]:res})
    }
  }
  const close = (stateKey) => {
    socket.emit('close state', stateKey)
    setStates(_.omit([stateKey])(states))
  }
  return <div>
    <p>
      <input value={inputRoom} onChange={(e) => setInputRoom(e.target.value)}></input> <button onClick={openRoom}>Open</button>
    </p>
    <hr/>
    {
      Object.entries(states).map(([k,v]) => <p key={k}><b>{k}:</b> {v}. <button onClick={() => changeVal(k)}>Edit</button> <button onClick={() => close(k)}>Close</button></p>)
    }
  </div>
}

export default SocketIOPage