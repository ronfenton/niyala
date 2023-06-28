import {
  BaseType,
  Base,
  BaseOperation,
  BaseAttribute,
  Attribute,
  Skill,
  CharacterState,
  ModdableValue,
  ModdableString,
} from "./types";
import _ from "lodash/fp";

export const CalculateBase = (b: Base, state: CharacterState): BaseResponse => {
  switch (b.type) {
    case BaseType.VALUE:
      return {
        text: b.value.toString(),
        value: b.value,
        itemsActive: [],
        itemsWaiting: [],
      };
    case BaseType.MATH:
      return calcBaseMath(b, state);
    case BaseType.ATTRIBUTE:
      return calcBaseAttr(b, state);
    default:
      return { text: "0", value: 0, itemsActive: [], itemsWaiting: [] };
  }
};

const calcBaseMath = (
  base: BaseOperation,
  state: CharacterState
): BaseResponse => {
  const a = CalculateBase(base.a, state);
  const b = CalculateBase(base.b, state);
  switch (base.operand) {
    case "+":
      return {
        text: `${a.text} + ${b.text}`,
        value: a.value + b.value,
        itemsActive: [...a.itemsActive, ...b.itemsActive],
        itemsWaiting: [...a.itemsWaiting, ...b.itemsWaiting],
      };
    case "-":
      return {
        text: `${a.text} - ${b.text}`,
        value: a.value - b.value,
        itemsActive: [...a.itemsActive, ...b.itemsActive],
        itemsWaiting: [...a.itemsWaiting, ...b.itemsWaiting],
      };
    case "*":
      return {
        text: `${a.text} * ${b.text}`,
        value: a.value * b.value,
        itemsActive: [...a.itemsActive, ...b.itemsActive],
        itemsWaiting: [...a.itemsWaiting, ...b.itemsWaiting],
      };
    case "/":
      return {
        text: `${a.text} / ${b.text}`,
        value: a.value / b.value,
        itemsActive: [...a.itemsActive, ...b.itemsActive],
        itemsWaiting: [...a.itemsWaiting, ...b.itemsWaiting],
      };
    default:
      return a;
  }
};

const calcBaseAttr = (
  base: BaseAttribute,
  state: CharacterState
): BaseResponse => {
  const attr = _.get(`attributes.${base.key}`)(state) as Attribute;
  if (attr == undefined) {
    return {
      text: `${base.key}`,
      value: base.fallback,
      itemsActive: [],
      itemsWaiting: [],
    };
  }
  return {
    text: `${attr.name}`,
    value: base.fallback,
    itemsActive: [],
    itemsWaiting: [],
  };
};

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