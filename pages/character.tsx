import React from 'react'
import { attribute, character } from '../characterApp/fixtures'
import { CharacterState } from '../characterApp/types'

const CharacterPage = () => {
  const logger = (x:string) => console.log(`injected logger msg: ${x}`)
  const reducer = (state:CharacterState,action:any) => reducerWithLogger(state,action,logger)
  const [state, dispatch] = React.useReducer(reducer,{character:character({}),registry:{}})
  
  return <div>
    <h2>Character Page</h2>
    <CharacterContext.Provider value={{state,dispatch}}>
      <InputElement/>
      <DisplayElement/>
    </CharacterContext.Provider>
  </div>
}

const initialState = {state:{} as CharacterState,dispatch:undefined as React.Dispatch<any>}

const CharacterContext = React.createContext(initialState)

const reducerWithLogger = (state:CharacterState, action:any, externalApp:(x:string) => void) => {
  switch (action.type) {
    case "A": 
      return {...state,attributes:{a:attribute({})}}
    case "B": 
      return {character:character({}), registry: {}}
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