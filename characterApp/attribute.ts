import _ from "lodash/fp";
import type { Attribute, CSAction, CSEvent, CharacterState, Environment, InsertOptions, CSEventAction, CSListenerRecord } from "./types";
import { CalculateBase, CostMapPointsToLevel, getModdedValue, StringToValidKey } from './utility'
import { CSEventNames } from "./enums";
import { UpdateRegistry } from "./eventSystem";

export const RecalculateLevel = (path: string): CSAction => (env: Environment, state: CharacterState) => {
  const a = _.get(path)(state.character)
  if(a === undefined) {
    throw new Error(`Attribute ${path} not found`)
  }
  const { character, registry } = state
  const calced = CalculateLevel(env, state, a, path)
  return {
    state: {
      character: _.set(path, calced.a)(character),
      registry: UpdateRegistry(registry, calced.baseListeners, "RecalculateLevel", path)
    },
    events: a.lvl !== calced.a.lvl
      ? [
        {
          name: CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
          origin: path,
          data: calced.a.lvl,
        }]
      : [

      ]
  }
}

export const AttributeEventsHandler = {
  RecalculateLevel: (env: Environment, state: CharacterState, path: string, event: CSEvent) => RecalculateLevel(path)(env, state)
}

const CalculateLevel = (env: Environment, state: CharacterState, a: Attribute, path:string): { a: Attribute, baseListeners: CSListenerRecord[] } => {
  const Base = CalculateBase(a.base, state,{funcID:"RecalculateLevel",listenerPath:path,listenerType:"Attribute"})
  const BoughtLevels = CostMapPointsToLevel(a.levelMap, getModdedValue(a.points))
  const Level = Base.value + BoughtLevels + a.lvlMod
  const newAttr = {
    ...a,
    lvlBase: Base.value,
    lvl: Level,
    lvlPurchase: BoughtLevels
  }
  return { a: newAttr, baseListeners: Base.listeners }
}

export const InsertAttribute = (a: Attribute, opts: InsertOptions): CSAction => {
  return (env: Environment, state: CharacterState) => {
    const { character, registry } = state
    const defaultKey = StringToValidKey(a.name)
    if (character.attributes[defaultKey] != undefined) {
      const method = opts.conflictMethod === "prompt" ? env.prompter.select({
        title: "",
        description: "",
        permitCancel: false
      }, [], "overwrite") : opts.conflictMethod
      switch (method) {
        case "overwrite":
          {
            const calced = CalculateLevel(env, state, a, `attributes.${defaultKey}`)
            return {
              state: {
                character: _.set(`attributes.${defaultKey}`, calced.a)(character),
                registry: UpdateRegistry(registry, calced.baseListeners, "RecalculateLevel", `attributes.${defaultKey}`)
              },
              events: [{ name: CSEventNames.ATTRIBUTE_LEVEL_CHANGED, origin: defaultKey }]
            }
          }
        case "ignore":
          return { state: { character, registry }, events: [] }
        default:
          throw new Error(`Unhandled duplicate attribute on insert ${a.name}`)
      }
    }
    const calced = CalculateLevel(env, state, a, `attributes.${defaultKey}`)
    return {
      state: {
        character: _.set(`attributes.${defaultKey}`, calced.a)(character),
        registry: UpdateRegistry(registry, calced.baseListeners, "RecalculateLevel", `attributes.${defaultKey}`)
      },
      events: [
        {
          name: CSEventNames.ATTRIBUTE_CREATED,
          origin: defaultKey
        }
      ]
    }
  }
}