import type {Context,Characteristic,Character,CharacterState, Attribute} from "./types"
import _ from "lodash/fp"

/**
 * Completely wipes the registry, and iteratively recalculates every single item
 * on the character. This is an expensive operation, designed for urgent clean-up
 * operations, major version updates, error handling, or *initial* character 
 * creation
 * @param c The character state to be reevaluated.
 */
const RecalculateAll = (ctx:Context):CharacterState => {
  return ctx.state
}

type InsertOptions = {
  conflictMethod?: "prompt" | "ignore" | "duplicate" | "overwrite" | "combinelevel" | "combinepoints" | "error",
  keyOverride?: string
}

const insertAttribute = (ctx:Context,a:Attribute,opts:InsertOptions):Character => {
  if(ctx.state.character.attributes[a.name] != undefined) {
    switch (opts.conflictMethod) {
      case "overwrite": 
        return _.set(`state.character.attributes.${a.name}`,a)(ctx).state.character
      case "ignore":
        return ctx.state.character
      default:
        throw new Error(`Unhandled duplicate advantage on insert ${a.name}`)
    }
  }
}