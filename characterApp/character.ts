import type { CharacterState, Environment, CSEvent, CSAction, EventActionMap } from "./types"
import _ from "lodash/fp"
import { GetListenersForEvent } from "./eventSystem"
import { AttributeEventsHandler } from "./attribute"

const EventActionMap:EventActionMap = {
  Attribute: AttributeEventsHandler
}

/**
 * Completely wipes the registry, and iteratively recalculates every single item
 * on the character. This is an expensive operation, designed for urgent clean-up
 * operations, major version updates, error handling, or *initial* character 
 * creation
 * @param c The character state to be reevaluated.
 */
const RecalculateAll = (s: CharacterState): CharacterState => {
  return s
}

export const PerformAction = (env: Environment, state: CharacterState, action: CSAction, eventActionMap: EventActionMap): CharacterState => {
  const result = action(env, state)
  return result.events.reduce(eventProcessor(env,eventActionMap),{state:result.state,events:[]}).state
}

/**
 * The event processor is an iterator for CSEvent arrays. It iterates over them
 * in a breadth-first approach, until there are no more events, or an error.
 * There is currently no recursion check
 * TODO: Add recursion check.
 * @param env 
 * @param actionMap 
 * @returns 
 */
const eventProcessor = (env:Environment,actionMap:EventActionMap): (acc:{state:CharacterState,events:CSEvent[]},event:CSEvent) => {state:CharacterState,events:CSEvent[]} => {
  return (acc:{state:CharacterState,events:CSEvent[]},event:CSEvent):{state:CharacterState,events:CSEvent[]} => {
    const listeners = GetListenersForEvent(acc.state.registry,event)
    const result = listeners.reduce((listenerAcc,listener) => {
      const actionResult = actionMap[listener.listenerType][listener.funcID](env,acc.state,listener.listenerPath,event.data)
      return {
        state:actionResult.state,
        events:[...listenerAcc.events,...actionResult.events]
      }
    },{state:acc.state,events:[]} as {state:CharacterState,events:CSEvent[]})

    if(result.events.length === 0) {
      return result
    }

    return result.events.reduce(eventProcessor(env,actionMap),{state:result.state,events:[]} as {state:CharacterState,events:CSEvent[]})
  }
}