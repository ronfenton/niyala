import type {Characteristic,Character,CharacterState, Attribute, Environment} from "./types"
import _ from "lodash/fp"
import { StringToKey } from "./utility"

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

type InsertOptions = {
  conflictMethod?: "prompt" | "ignore" | "duplicate" | "overwrite" | "combinelevel" | "combinepoints" | "error",
  keyOverride?: string
}

export const InsertAttribute = (e:Environment,{character,registry}:CharacterState,a:Attribute,opts:InsertOptions):{state:CharacterState,events:string[]} => {
  const defaultKey = AttributeToKey(a)
  if(character.attributes[defaultKey] != undefined) {
    const method = opts.conflictMethod === "prompt" ? e.prompter.select({
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
          events: []
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
      `AttributeCreated`,
      `AttributeCreated-${defaultKey}`
    ]
  }
}

const AttributeToKey = (a:Attribute):string => {
  return StringToKey(a.name)
}
