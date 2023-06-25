import React from 'react'
import { attribute, character } from '../characterApp/fixtures'
import { CharacterState } from '../characterApp/types'
import AttributeDetail from '../components/CharacterApp/AttributeDetail'

const CharacterPage = () => {
  const logger = (x:string) => console.log(`injected logger msg: ${x}`)
  const reducer = (state:CharacterState,action:any) => reducerWithLogger(state,action,logger)
  const [state, dispatch] = React.useReducer(reducer,{character:character({}),registry:{}})
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

type CharacterInstruction = {
  type: string,
  payload?: any,
}

const initialState = {state:{} as CharacterState,dispatch:undefined as React.Dispatch<any>}

export const CharacterContext = React.createContext(initialState)

const reducerWithLogger = (state:CharacterState, action:CharacterInstruction, externalApp:(x:string) => void) => {
  switch (action.type) {
    case "A": 
      return {...state,character:{...state.character,attributes:{a:attribute({})}}}
    case "B": 
      return {character:character({}), registry: {}}
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