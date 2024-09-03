import { Attribute, Character, Environment, Logger, ObjectModifier, Prompter, PrompterSettings } from './types';
import * as enums from './enums';

export const attribute = (x:Partial<Attribute>):Attribute => {
  const a:Attribute = {
    name: 'Attribute',
    description: 'Description',
    base: 10,
    lvlBase: 10,
    lvlMod: 0,
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
    characteristics: {
      attributes: {},
      objectMods: {},
    },
    version: { current: '0', last: '-1' },
    id: '0',
    objectModifierRegister: {},
    ...x,
  };
  return c;
};

export const environment = (x:Partial<{logger:Partial<Logger>,prompter:Partial<Prompter>}>):Environment => {
  const e:Environment = {
    logger: {
      debug: console.debug,
      log: console.info,
      warn: console.log,
      error: console.warn,
      fatal: console.error,
      ...(x.logger !== undefined ? x.logger : {})
    },
    prompter: {
      bool: () => Math.random() >= 0.5,
      number: () => Math.ceil(Math.random()*100),
      text: () => Math.ceil(Math.random()*100).toString(),
      select: (_, options: string[]): string => options[Math.floor(Math.random()*options.length)],
      ...(x.prompter !== undefined ? x.prompter : {})
    },
  };
  return e;
}