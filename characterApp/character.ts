import type * as type from "./types"

/**
 * Completely wipes the registry, and iteratively recalculates every single item
 * on the character. This is an expensive operation, designed for urgent clean-up
 * operations, major version updates, error handling, or *initial* character 
 * creation
 * @param c The character state to be reevaluated.
 */
const RecalculateAll = (ctx:type.Context):type.CharacterState => {
  return ctx.state
}

type InsertOptions = {
  conflictMethod?: "prompt" | "ignore" | "duplicate" | "overwrite" | "combinelevel" | "combinepoints" | "error",
  keyOverride?: string
}

