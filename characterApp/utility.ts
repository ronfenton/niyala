import {
  DerivedValue,
  CharacterState,
  ModdableValue,
  ModdableString,
  DerivedValueBracket,
  DerivedValueAttribute,
  Attribute,
  CostLevelMap,
  CSListenerRecord,
  CSTriggerRecord,
} from "./types";
import * as enums from "./enums"
import _ from "lodash/fp";
import { customAlphabet } from "nanoid";

// GENERIC FUNCTIONS
const arithmetic = (operand,a,b) => {
  switch(operand) {
    case "+": return a + b;
    case "-": return a - b;
    case "x": return a * b;
    case "/": return a / b;
    default: throw new Error("unrecognized operand")
  }
}

export const calcModdedValue = (v:number,mods:ValueModifier[]):ModdableValue => {
  if(mods.length == 0) { return v }
  return {
    base: v,
    mods,
    modded: mods.reduce((acc,m) => acc + m.value,v)
  }
}

export const calcModdedString = (s:string,mods:StringModifier[]):ModdableString => {
  if(mods.length == 0) { return s }
  return {
    base: s,
    mods,
    modded: mods.reduce((acc,m) => acc + m, s)
  }
}

export const getModdedValue = (v:ModdableValue):number => {
  if (typeof v === 'number') {
    return v;
  } 
  return v.modded;
}

export const getModdedString = (s:ModdableString):string => {
  if (typeof s === 'string') {
    return s;
  }
  return s.modded;
}

export const getBaseValue = (v:ModdableValue):number => {
  if (typeof v === 'number') {
    return v;
  } 
  return v.base
}

export const getBaseString = (s:ModdableString):string => {
  if (typeof s === 'string') {
    return s;
  } 
  return s.base
}

export const StringToValidKey = (s:string):string => {
  return s.trim().replace(/[-\s]/g,"_")
}

// COST TABLE FUNCTIONS
export const CostMapLevelToPoints = (table:CostLevelMap, lvl:number) => {
  const {
    flat,
    perLvl,
    progression,
    custom,
  } = table

  const ptsFromFlat = flat || 0
  const ptsFromProgression = table.progression != undefined && lvl != 0
    ? progression[Math.min(progression.length,lvl) - 1]
    : 0
  const ptsFromLevel = perLvl != undefined && lvl != 0 
    ? progression != undefined 
      ? Math.max(0,lvl - progression.length) * (progression[0] < 0 && perLvl > 0 ? perLvl*-1 : perLvl)
      : perLvl * lvl
    : 0
  const ptsFromCustom = custom || 0

  return ptsFromFlat + ptsFromProgression + ptsFromLevel + ptsFromCustom
};

export const CostMapPointsToLevel = (table:CostLevelMap, points:number) => {
  const {
    flat,
    perLvl,
    progression,
    custom,
  } = table

  if(progression === undefined && perLvl === undefined) { return 0 }

  const ptsAfterFlats = points - (flat || 0) - (custom || 0)

  if(progression != undefined && perLvl != undefined) {
    const lvlsFromProgression = progression.reduce((acc,val,i) => Math.abs(val)<=Math.abs(ptsAfterFlats) ? i+1 : acc,0)
    if(lvlsFromProgression !== progression.length) { return lvlsFromProgression }
    return lvlsFromProgression + Math.trunc((ptsAfterFlats - progression[progression.length-1]) / perLvl)
  }

  if(progression !== undefined) {
    return progression.reduce((acc,val,i) => Math.abs(val)<=Math.abs(ptsAfterFlats) ? i+1 : acc,0)
  }
  return Math.trunc(ptsAfterFlats / perLvl)
}

export const TriggerListToListeners = (triggers:CSTriggerRecord[],funcID:string,listenerPath:string,listenerType:string):CSListenerRecord[] => {
  return _.uniq([...triggers]).map(x => { return {...x, funcID, listenerPath, listenerType}})
}

// BASE FUNCTIONS
export const CalculateBase = (b: DerivedValue, state: CharacterState, eventDetail: {funcID:string,listenerType:string,listenerPath:string}): BaseResponse => {
  if(typeof b == "number") {
    return { text: b.toString(), value: b, listeners: []}
  }
  switch (b.type) {
    case enums.BaseType.VALUE:
      return {
        text: b.value.toString(),
        value: b.value,
        listeners: [],
      };
    case enums.BaseType.BRACKET:
      return calcBracket(b,state, eventDetail)
    case enums.BaseType.ATTRIBUTE:
      return calcBasedAttribute(b,state, eventDetail)
    default:
      throw new Error(`Calculating base - invalid base: ${b}`);
  }
};

const calcBracket = (b: DerivedValueBracket, state: CharacterState, eventDetail: {funcID:string,listenerType:string,listenerPath:string}):BaseResponse => {
  if(b.values.length !== b.operands.length + 1) {
    throw new Error(`Bracket evaluation failed: ${b.values.length} values but ${b.operands.length} operands.`)
  }
  const calculatedValues = b.values.map(x => CalculateBase(x,state,eventDetail))

  const helper = (values:number[],operands:string[]) => {
    if(values.length === 1 || operands.length === 0) { return values[0] }
    const operandPos = Math.max(operands.findIndex(x => x === "x" || x === "/"),0)
    const result = arithmetic(operands[operandPos],values[operandPos],values[operandPos+1])
    const remOperands = [ ...operands.slice(0,operandPos),...operands.slice(operandPos+1)]
    const remValues = [...values.slice(0,operandPos),result,...values.slice(operandPos+2)]
    return helper(remValues,remOperands)
  }

  const result = helper(calculatedValues.map(x => x.value),b.operands)

  return { 
    text: `( ${[...b.operands.map((x,i) => `${calculatedValues[i].text} ${x}`),calculatedValues[calculatedValues.length-1].text].join(" ")} )`, 
    value: result, 
    listeners: _.uniq(calculatedValues.reduce((list,result) => [...list,...result.listeners],[]))
  }
}

const calcBasedAttribute = (b:DerivedValueAttribute, state:CharacterState, eventDetail: {funcID:string,listenerType:string,listenerPath:string}):BaseResponse => {
  const attr = _.get(b.key)(state.character.attributes) as Attribute
  if(attr == undefined) {
    return {
      text: `?${b.key}?(${b.fallback})`,
      value: CalculateBase(b.fallback,state,eventDetail).value,
      listeners: [
        {eventName:enums.CSEventNames.ATTRIBUTE_CREATED,origin:`attributes.${b.key}`,...eventDetail}
      ]
    }
  }
  return {
    text: attr.abbreviation || attr.name,
    value: getModdedValue(attr.lvl),
    listeners: [
      {eventName:enums.CSEventNames.ATTRIBUTE_LEVEL_CHANGED,origin:`attributes.${b.key}`,...eventDetail},
      {eventName:enums.CSEventNames.ATTRIBUTE_DELETED,origin:`attributes.${b.key}`,...eventDetail},
    ]
  }
}

export type BaseResponse = {
  text: string;
  value: number;
  listeners: CSListenerRecord[];
};

type ValueModifier = {
  operand: "+" | "-" | "*" | "/",
  value: number,
  priority?: number,
}

type StringModifier = {
  operand: "prepend" | "append",
  value: string,
  priority?:number,
}

// EVENT SYSTEM


export const withoutEmptyArray = (arr:any[],key:string) => {
  if(arr.length === 0) return {}
  return { [key]: arr }
}

export const withoutEmptyObject = (obj:object,key:string) => {
  if(Object.keys(obj).length === 0) return {}
  return { [key]: obj }
}

const nanoidAlpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const nanoid = customAlphabet(nanoidAlpha,12)
export const generateID = () => nanoid()