import type {Characteristic,Character,CharacterState, Attribute, Environment, CSEvent, CSAction, InsertOptions} from "./types"
import _ from "lodash/fp"
import { StringToValidKey } from "./utility"

/**
 * Completely wipes the registry, and iteratively recalculates every single item
 * on the character. This is an expensive operation, designed for urgent clean-up
 * operations, major version updates, error handling, or *initial* character 
 * creation
 * @param c The character state to be reevaluated.
 */
const RecalculateAll = (s:CharacterState):CharacterState => {
  return s
}

export const PerformAction = (env:Environment,state:CharacterState,action:CSAction) => {
  const result = action(env,state)
  
}

export const processEvents = (env:Environment, state:CharacterState,events:CSEvent[]):CharacterState => {

  const eventProcessor = (state:CharacterState, events:CSEvent[]):{state:CharacterState,events:CSEvent[]} => {

    // if there are no events to perform: do nothing.
    if(events === undefined || events.length === 0) { 
      return { state, events: [] } 
    }

    // process all events and accumulate a new ongoing state, and any newly generated events.
    const pass = events.reduce((acc,event) => { 
      const res = handleEvent(env,acc.state,event); 
      return { 
        state: res.state, 
        events:[...acc.events,...res.events]
      }
    },{state,events:[]})

    // If new events have been generated, process them.
    // Use _.uniq to prevent repeated events.
    if(pass.events.length > 0) {
      return eventProcessor(pass.state,_.uniq(pass.events))
    }

    // otherwise, return finally updated state with no events to process.
      return { state: pass.state, events: [] }
  }

  return eventProcessor(state,events).state
}

export const handleEvent = (env:Environment, state:CharacterState, events:CSEvent): {state:CharacterState,events:[]} => {

  return {state,events:[]}
}

export const InsertAttribute = (a:Attribute,opts:InsertOptions):CSAction => {
  return (env:Environment, {character,registry}:CharacterState) => {
    const defaultKey = NameToKey(a)
    if(character.attributes[defaultKey] != undefined) {
      const method = opts.conflictMethod === "prompt" ? env.prompter.select({
        title: "",
        description: "",
        permitCancel: false
      },[],"overwrite") : opts.conflictMethod
      switch (method) {
        case "overwrite": 
          return {
            state: {
              character:_.set(`attributes.${defaultKey}`,a)(character),
              registry
            },
            events: [{name:'AttributeLevelUpdated',origin:defaultKey}]
          }
        case "ignore":
          return {state:{character,registry},events:[]}
        default:
          throw new Error(`Unhandled duplicate attribute on insert ${a.name}`)
      }
    }
    return {
      state: {
        character:_.set(`attributes.${defaultKey}`,a)(character),
        registry
      },
      events:[
        {
          name:'Attribute Created',
          origin: defaultKey
        }
      ]
    }
  }
}

const NameToKey = (a:Attribute):string => {
  return StringToValidKey(a.name)
}
