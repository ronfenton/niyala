import _ from "lodash/fp";
import type { Attribute, CSAction, CSEvent, CSListenerMap, CharacterState, Characteristic, Environment, InsertOptions, ModdableValue, SubscribedCSEventsMap } from "./types";
import { CSListener as CSListener, BaseResponse, CalculateBase, CostMapPointsToLevel, getModdedValue, StringToValidKey } from './utility'
import { CSEventNames } from "./enums";
import { AddSubscriptions, RemSubscriptions } from "./eventSystem";

export const RecalculateLevel = (path: string): CSAction => {
  return (env: Environment, state: CharacterState): { state: CharacterState, events: CSEvent[] } => {
    const {character,registry} = state
    const a = _.get(path)(character) as Attribute
    if (a === undefined) {
      throw new Error(`Attribute ${path} not found`)
    }
    const Base = CalculateBase(a.base, state)
    const BoughtLevels = CostMapPointsToLevel(a.levelMap, getModdedValue(a.points))
    const Level = Base.value + BoughtLevels + a.lvlMod
    const newAttr = {
      ...a,
      lvlBase: Base.value,
      lvl: Level,
      lvlPurchase: BoughtLevels,
      subscribedEvents: AddSubscriptions(RemSubscriptions(a.subscribedEvents, 'CalculateLevel'), Base, 'CalculateLevel')
    }
    const upListeners = GetListenerChanges(a,newAttr)
    return {
      state: {
        character: _.set(path, newAttr)(character),
        registry: UpdateRegistry(registry,path,upListeners.add,upListeners.rem)
      },
      events: a.lvl !== newAttr.lvl
        ? [
            {
              name: CSEventNames.ATTRIBUTE_CHANGED_LEVEL,
              origin: path,
              data: Level,
            }
          ]
        : []
    }
  }
}

export const InsertAttribute = (a:Attribute,opts:InsertOptions):CSAction => {
  return (env:Environment, {character,registry}:CharacterState) => {
    const defaultKey = StringToValidKey(a.name)
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
