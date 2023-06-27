import {
  BaseType,
  Base,
  BaseOperation,
  BaseAttribute,
  Attribute,
  Skill,
  CharacterState,
} from "./types";
import _ from "lodash/fp";

const ParseBase = (b: Base, state: CharacterState): BaseResponse => {
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
  const a = ParseBase(base.a, state);
  const b = ParseBase(base.b, state);
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
