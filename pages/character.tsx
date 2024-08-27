import React from 'react'
import { attribute, character } from '../characterApp/fixtures'
import { Socket, io } from 'socket.io-client'
import { CharacterState, Characteristic } from '../characterApp/types'
import AttributeDetail from '../components/CharacterApp/AttributeDetail'

const xxxCharacterPage = () => {
  const logger = (x:string) => console.log(`injected logger msg: ${x}`)
  const reducer = (state:CharacterState,action:any) => reducerWithLogger(state,action,logger)
  const [state, dispatch] = React.useReducer(reducer,{character:character({}),registry:[]})
  console.log(state)
  
  return <div>
    <h2>Character Page</h2>
    <CharacterContext.Provider value={{state,dispatch}}>
      <InputElement/>
      <DisplayElement/>
      {Object.entries(state.character.attributes).map(([k,v]) => <AttributeDetail key={k} a={v} itemKey={k}/> )}
    </CharacterContext.Provider>
  </div>
}

const CharacterPage = () => {
  const so = io(':3001')
  const [isConnected,setIsConnected] = React.useState(so.connected)
  const [state, dispatch] = React.useReducer(reducer,undefined as CharacterState);
  hookSocket(so,dispatch)
  return <div>
    <CharacterContext.Provider value={{state,dispatch}}>
      <h1>Character Page </h1>
      <SocketIOInserter {...{so}}/>
      { state != undefined ? <CharacteristicDisplay {...{obj:state.character.attributes,keyNames:[["name","Attributes"],["lvl","Lvl"]]}} /> : null }
    </CharacterContext.Provider>
  </div>
}

const SocketIOInserter = (props:{so:Socket}) => {
  const {so} = props
  const [input,setInput] = React.useState('');
  const createCharacter = () => so.emit('create_req',{id:input})
  const loadCharacter = () => so.emit('open_req',{id:input})
  return <div><input value={input} onChange={(e) => setInput(e.target.value)}/> <button onClick={createCharacter}>Create</button> <button onClick={loadCharacter}>Load</button></div>
}

const hookSocket = (so:Socket,dispatch: React.Dispatch<any>) => {
  so.on('state_changed', (payload:{state:CharacterState,id:string}) => {
    console.log(payload)
    dispatch({type:'set_state',payload:payload.state})
  })
  so.on('state_opened', (payload:{state:CharacterState,id:string}) => {
    console.log(payload)
    dispatch({type:'set_state',payload:payload.state})
  })
}
/**
 * A very simplistic characteristic table. Takes a root characteristic object (EG; `character.attributes`),
 * and a tuple list of [key,title] you want displayed (EG: [["name","Attribute"],["lvl","Level"]]).
 * This element is largely for basic testing / display.
 */
const CharacteristicDisplay = (props:{obj:{[uuid:string]:Characteristic},keyNames:[string,string][]}) => {
  const {obj,keyNames} = props
  console.log(obj);
  return <table>
    <thead>
    <tr>
      {keyNames.map(kn => <th key={`title_${kn[0]}`}><strong>{kn[1]}</strong></th>)}
    </tr>
    </thead>
    <tbody>
    {
      Object.keys(obj).map(okey => <tr key={`obj_${okey}`}>
        {
          keyNames.map(kn => <td key={okey+kn[0]}>{obj[okey][kn[0]]}</td>)
        }
      </tr>)
    }
    </tbody>
  </table>
}

type CharacterInstruction = {
  type: string,
  payload?: any,
}

const initialState = {state:{} as CharacterState,dispatch:undefined as React.Dispatch<any>}

export const CharacterContext = React.createContext(initialState)

const reducer = (state: CharacterState, action:CharacterInstruction):CharacterState => {
  switch (action.type) {
    case `set_state`: 
      return action.payload
    default:
      console.log(`nada`);
      return;
  }
}

const reducerWithLogger = (state:CharacterState, action:CharacterInstruction, externalApp:(x:string) => void) => {
  switch (action.type) {
    case "A": 
      return {...state,character:{...state.character,attributes:{a:attribute({})}}}
    case "B": 
      return {character:character({}), registry: []}
    case "SET_ATTR": 
      return {...state,character:{...state.character,attributes:{...state.character.attributes,[action.payload.key]:action.payload.data}}}
    default:
      externalApp(`Unrecognized Action: ${action.type}`)
      return state
  }
}

const InputElement = () => {
  const { dispatch } = React.useContext(CharacterContext)
  const [state,setState] = React.useState("")
  const submit = () => dispatch({type:state})
  return <div>
    <input value={state} onChange={(e) => setState(e.target.value)} />
    <button onClick={submit}>Submit</button>
  </div>
}

const DisplayElement = () => {
  const { state } = React.useContext(CharacterContext)
  return <pre>
    {JSON.stringify(state,null,2)}
  </pre>
}

export default CharacterPage