import {
  BaseType,
  Base,
  CharacterState,
  ModdableValue,
  ModdableString,
  BaseBracket,
  BaseAttribute,
  Attribute,
} from "./types";
import _ from "lodash/fp";

export const CalculateBase = (b: Base, state: CharacterState): BaseResponse => {
  if(typeof b == "number") {
    return { text: b.toString(), value: b, itemsActive: [], itemsWaiting:[]}
  }
  switch (b.type) {
    case BaseType.VALUE:
      return {
        text: b.value.toString(),
        value: b.value,
        itemsActive: [],
        itemsWaiting: [],
      };
    case BaseType.BRACKET:
      return calcBracket(b,state)
    case BaseType.ATTRIBUTE:
      return calcBasedAttribute(b,state)
    default:
      throw new Error(`Calculating base - invalid base: ${b}`);
  }
};

const arithmetic = (operand,a,b) => {
  switch(operand) {
    case "+": return a + b;
    case "-": return a - b;
    case "x": return a * b;
    case "/": return a / b;
    default: throw new Error("unrecognized operand")
  }
}

const calcBracket = (b: BaseBracket, state: CharacterState):BaseResponse => {
  if(b.values.length !== b.operands.length + 1) {
    throw new Error(`Bracket evaluation failed: ${b.values.length} values but ${b.operands.length} operands.`)
  }
  const calculatedValues = b.values.map(x => CalculateBase(x,state))

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
    itemsActive: _.uniq(calculatedValues.reduce((list,result) => [...list,...result.itemsActive],[])), 
    itemsWaiting: _.uniq(calculatedValues.reduce((list,result) => [...list,...result.itemsWaiting],[]))}
}

const calcBasedAttribute = (b:BaseAttribute, state:CharacterState):BaseResponse => {
  const attr = _.get(b.key)(state.character.attributes) as Attribute
  if(attr == undefined) {
    return {
      text: `?${b.key}?(${b.fallback})`,
      value: CalculateBase(b.fallback,state).value,
      itemsActive:[],
      itemsWaiting:[`attributes.${b.key}`]
    }
  }
  return {
    text: attr.abbreviation || attr.name,
    value: attr.lvl,
    itemsActive: [`attributes.${b.key}`],
    itemsWaiting: [],
  }
}

type BaseResponse = {
  text: string;
  value: number;
  itemsActive: CharacterItemPath[];
  itemsWaiting: CharacterItemPath[];
};

type CharacterItemPath = string;

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

export const StringToKey = (s:string):string => {
  return s.trim().replace(/[-\s]/g,"_")
}