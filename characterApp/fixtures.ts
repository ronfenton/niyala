import { Attribute, Character, ObjectModifier } from './types';
import * as enums from './enums';

export const attribute = (x:Partial<Attribute>):Attribute => {
  const a:Attribute = {
    name: 'Attribute',
    description: 'Description',
    base: 10,
    lvlBase: 10,
    lvlMod: 0,
    lvlPurchase: 0,
    lvlBought: 0,
    lvl: 10,
    tags: [],
    points: 0,
    levelMap: {
    },
    ...x,
  };
  return a;
};

export const objectMod = (x:Partial<ObjectModifier>):ObjectModifier => {
  const a:ObjectModifier = {
    name: 'Test',
    description: 'Description',
    tags: [],
    selector: {
      charType: enums.CharacteristicType.TESTING,
      filter: {
        type: 'value',
        a: 0,
        b: 0,
        comparator: '>',
      },
    },
    effect: {
      targetProp: 'lvl',
      effectType: enums.ModifierEffectType.VALUE,
      operand: enums.ValueOperands.PLUS,
      value: 1,
    },
    ...x,
  };
  return a;
};

export const character = (x:Partial<Character>):Character => {
  const c:Character = {
    attributes: {},
    skills: {},
    items: {},
    resources: {},
    version: { current: '0', last: '-1' },
    id: '0',
    objectMods: {},
    objectModifierRegister: {},
    ...x,
  };
  return c;
};
