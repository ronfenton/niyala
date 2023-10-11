import _ from "lodash/fp"
import type {ObjectModifier, ObjectModifierMap, Environment, CharacterState, InsertOptions, CSAction, Characteristic, DerivedValue, ModdableString, CSListenerRecord}  from "./types"
import { CalculateBase, CostMapPointsToLevel, generateID, getBaseString, getBaseValue, getModdedString, getModdedValue } from "./utility"
import * as enums from "./enums"
import { UpdateRegistry } from "./eventSystem"

export const InsertAttribute = (om: ObjectModifier, opts: InsertOptions): CSAction => (env: Environment, state: CharacterState) => {

  const generatedID = generateID()

  return {
    state:{
      ...state,
      character: {
        ...state.character,
        objectMods: {
          ...state.character.objectMods,
          [generatedID]: om
        }
      }
    },
    events:[]
  }
}

export const RecalculateValue = (path:string):CSAction => (env:Environment, state:CharacterState) => {
  const a = _.get(path)(state.character)
  if(a === undefined) {
    throw new Error(`Attribute ${path} not found`)
  }
  const { character, registry } = state
  const calced = CalculateValue(env, state, a, path)
  return {
    state: {
      character: _.set(path, calced.o.effect.value)(character),
      registry: UpdateRegistry(registry, calced.baseListeners, "RecalculateValue", path)
    },
    events: a.lvl !== calced.o.effect.value
      ? [
        {
          name: enums.CSEventNames.MODIFIER_EFFECT_CHANGED,
          origin: path,
          data: calced.o.effect.value,
        }]
      : [

      ]
  }
}

const CalculateValue = (env: Environment, state: CharacterState, o: ObjectModifier2, path:string): { o: ObjectModifier2, baseListeners: CSListenerRecord[] } => {
  const Base = CalculateBase(o.effect.calcValue, state,{funcID:"RecalculateValue",listenerPath:path,listenerType:"Modifier"})
  const newModifier = {
    ...o,
    effect:{
      ...o.effect,
      value:Base.value,
    }
  }
  return { o: newModifier, baseListeners: Base.listeners }
}

const DetermineFilterListeners = (env:Environment, state:CharacterState, o:ObjectModifier2, path:string): { baseListeners: CSListenerRecord[] } => {

  const SelectorHelper = (s:Selector):{filterChangeEvents: CSListenerRecord[], subjectChangeEvents: string[]} => {
    switch(s.type) {
      case "string":
        return {
          filterChangeEvents: [],
          subjectChangeEvents: [],
        }
      case "boolean":
      case "value":
      case "logic":
      case "none":
    }
  }

  const listeners = o.selector.selector !== undefined 
    ? o.selector.selector
    : []
  return {}
}

export const UpdateSubjects = (path:string): CSAction => (env:Environment, state: CharacterState) => {
  const om = _.get(`character.${path}`)(state)
  const newState = Object.entries(state.character[om.type]).reduce((accState,[k,o]) => {
    if (om.selector.excludeKeys.includes(k)) { 
      return Unsubscribe(om.type,k,path,om.effect.targetKey,accState) 
    }
    if (om.selector.limitKeys !== undefined && !om.selector.limitKeys.includes(k)) {
      return Unsubscribe(om.type,k,path,om.effect.targetKey,accState) 
    }
    if (om.selector.selector === undefined) { 
      return Subscribe(om.type,k,path,om.effect.targetKey,accState) 
    }
    if (FilterSelector(om.selector.selector,o as Characteristic)) {
      return Subscribe(om.type,k,path,om.effect.targetKey,accState) 
    }
  },state)
  return {
    state:newState,
    events:[
      {
        name:enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin:path,
      }
    ]
  }
}

const FilterObjects = (filter:([string,Characteristic]) => boolean, om:ObjectModifier2, type: string, state: CharacterState) => {
  const reduced = Object.entries(state.character[type]).filter(filter)
}

type ObjectModifier2 = Characteristic & {
  selector: {
    limitKeys?: string[], // list of object keys used by filters.
    excludeKeys: string[],
    selector?: Selector,
  },
  currentSubjects: string[],
  effect: {
    targetKey:string,
    calcValue: DerivedValue,
    value: number,
    operator: enums.Operands,
  }
  type: string,
}

const UpdateSelections = (om:ObjectModifier2, modifierPath:string, state: CharacterState) => {
  const processed = Object.entries(state.character[om.type]).reduce((accState,[k,o]) => {
    if (om.selector.excludeKeys.includes(k)) { 
      return Unsubscribe(om.type,k,modifierPath,om.effect.targetKey,accState) 
    }
    if (om.selector.limitKeys !== undefined && !om.selector.limitKeys.includes(k)) {
      return Unsubscribe(om.type,k,modifierPath,om.effect.targetKey,accState) 
    }
    if (om.selector.selector === undefined) { 
      return Subscribe(om.type,k,modifierPath,om.effect.targetKey,accState) 
    }
    if (FilterSelector(om.selector.selector,o as Characteristic)) {
      return Subscribe(om.type,k,modifierPath,om.effect.targetKey,accState) 
    }
  },state)
}

const ModdableAttributeValues = {
  lvl: {
    type: "value",
    funcID: "RecalculateLevel",
  },
  points: {
    type: "value",
    funcID: "RecalculateLevel",
  }
}

type CharacteristicDefinition = {
  keyName: string,
  moddableValues: {
    [keyName:string]: {
      type: "value" | "string",
      funcID: string,
    }
  },
  filterableValues: {
    [keyName:string]: {
      type: "moddableValue" | "moddableString" | "value" | "string" | "boolean",
      changeEvent: string,
    }
  }
}

const Unsubscribe = (objectType:string,objectKey:string,modifierPath:string,targetKey:string,state:CharacterState):CharacterState => {
  const existingModifiers = state.character.objectModifierRegister?.[objectType]?.[objectKey]?.[targetKey]
  if(existingModifiers === undefined || !existingModifiers.includes(modifierPath)) {
    // no change needed. skip
    return state
  }
  const unlinked = _.set(`character.objectModifierRegister.${objectType}.${objectKey}.${targetKey}`)(_.without([modifierPath])(existingModifiers),state)
  return {
    ...unlinked,
    registry: [
      ...state.registry,
      {
        eventName:enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin:modifierPath,
        listenerPath:`${objectType}.${objectKey}`,
        listenerType:objectType,
        funcID:ModdableAttributeValues[targetKey].funcID,
      }
    ]
  }
}

const Subscribe = (objectType:string,objectKey:string,modifierPath:string,targetKey:string,state:CharacterState):CharacterState => {
  const existingModifiers = state.character.objectModifierRegister?.[objectType]?.[objectKey]?.[targetKey]
  if(existingModifiers != undefined && existingModifiers.includes(modifierPath)) {
    // no change needed. skip
    return state
  }
  const linked = _.set(`character.objectModifierRegister.${objectType}.${objectKey}.${targetKey}`)([modifierPath,...(existingModifiers || [])],state)
  return {
    ...linked,
    registry: [
      ...state.registry,
      {
        eventName:enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin:modifierPath,
        listenerPath:`${objectType}.${objectKey}`,
        listenerType:objectType,
        funcID:ModdableAttributeValues[targetKey].funcID,
      }
    ]
  }
}

type ValueSelector = {
  type: "value",
  targetKey:string,
  derivedValue:DerivedValue,
  value: number,
  comparitor: ">" | "<" | "=" | "!=",
  useUnmodded?: boolean,
}

type StringSelector = {
  type: "string"
  targetKey: string,
  value: string,
  comparitor: "regex" | "includes" | "is"
  useUnmodded?: boolean,
}

type LogicalSelector = {
  type: "logic"
  operator: "OR" | "AND" | "NOR" | "XOR" | "NOT",
  selectors: any[],
}

type BooleanSelector = {
  type: "boolean",
  targetKey: string,
  expect: boolean,
}

// for when there are no filters and this applies to all properties.
// typically used for targetted perks that are filtered by key, or universal 
// buffs like +1 to all Skills for a turn. etc.
type NoSelector = {
  type: "none",
}

type Selector = ValueSelector | StringSelector | LogicalSelector | BooleanSelector | NoSelector

const FilterSelector = (s:Selector, c:Characteristic):boolean => {
  switch(s.type) {
    case "none": 
      return true
    case "string":
      // stuff
      return StringTest(s,c)
    case "boolean":
      // stuff
      return BooleanTest(s,c)
    case "value":
      // stuff
      return ValueTest(s,c)
    case "logic":
      // stuff
      return LogicalTest(s,c)
  }
}

const ValueTest = (s:ValueSelector, c:Characteristic):boolean => {
  const value = s.useUnmodded ? getBaseValue(c[s.targetKey]) : getModdedValue(c[s.targetKey])
  switch (s.comparitor){
    case ">":
      return value > s.value
    case "<":
      return value < s.value
    case "=":
      return value === s.value
    case "!=":
      return value !== s.value
    default:
      return false
  }
}

const StringTest = (s:StringSelector, c:Characteristic):boolean => {
  const str = s.useUnmodded ? getBaseString(c[s.targetKey]) : getModdedString(c[s.targetKey])
  switch (s.comparitor){
    case "regex":
      return RegExp(s.value).test(str)
    case "includes":
      return str.includes(s.value)
    case "is":
      return str === s.value
    default: 
      return false
  }
}

const BooleanTest = (s:BooleanSelector, c:Characteristic):boolean => {
  return c[s.targetKey] === s.expect
}

const LogicalTest = (s:LogicalSelector, c:Characteristic):boolean => {
  switch (s.operator){
    case "OR":
      return s.selectors.reduce((result,filter) => result === false ? FilterSelector(filter,c) : true, false)
    case "AND":
      return s.selectors.reduce((result,filter) => result === true ? FilterSelector(filter,c) : false, true)
    case "NOR":
      return !s.selectors.reduce((result,filter) => result === false ? FilterSelector(filter,c) : true, false)
    case "NOT":
      return !FilterSelector(s.selectors[0],c)
  }
}