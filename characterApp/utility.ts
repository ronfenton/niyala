/* eslint-disable no-use-before-define */
import _ from 'lodash/fp';
import {
  DerivedValue,
  CharacterState,
  ModdableValue,
  ModdableString,
  DerivedValueBracket,
  CostLevelMap,
  CSListenerRecord,
  CSTriggerRecord,
  Characteristic,
  DerivedValueCharacteristic,
  DerivedValueResult,
  ComparatorValue,
  DerivedString,
  DerivedStringCharacteristic,
  DerivedStringResult,
  Comparator,
  ComparatorString,
  ComparatorLogic,
  ObjectModifierValue,
  Character,
  Environment,
} from './types';
import * as enums from './enums';
// import { customAlphabet } from "nanoid";

// GENERIC FUNCTIONS
const arithmetic = (operand, a, b) => {
  switch (operand) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case 'x':
      return a * b;
    case '/':
      return a / b;
    default:
      throw new Error('unrecognized operand');
  }
};

const sortArithmeticMods = (
  a: ObjectModifierValue,
  b: ObjectModifierValue,
): number => {
  if ((a.priority || 0) === (b.priority || 0)) {
    const aoperandprio = a.operand === enums.ValueOperands.DIVIDE || enums.ValueOperands.FACTOR
      ? 1
      : 0;
    const boperandprio = a.operand === enums.ValueOperands.DIVIDE || enums.ValueOperands.FACTOR
      ? 1
      : 0;
    return aoperandprio - boperandprio;
  }
  return (a.priority || 0) - (b.priority || 0);
};

export const getMods = (
  type: enums.CharacteristicType,
  key: string,
  property: string,
  state: CharacterState,
): string[] => state.character.objectModifierRegister[type]?.[key]?.[property] || [];

export const calcModdedValue = (
  subject: Characteristic,
  v: number,
  modKeys: string[],
  state: CharacterState,
): { value: ModdableValue; triggers: CSTriggerRecord[] } => {
  if (modKeys.length === 0) {
    return { value: v, triggers: [] };
  }
  const res = modKeys
    .map((key) => state.character.characteristics.objectMods[key].effect as ObjectModifierValue)
    .sort(sortArithmeticMods)
    .reduce(
      (acc, mod) => {
        const modVal = calcDerivedValue(mod.value, state, { subject });
        return {
          value: arithmetic(mod.operand, acc.value, modVal.value),
          triggers: [...acc.triggers, ...modVal.updateTriggers],
        };
      },
      { value: v, triggers: [] } as {
        value: number;
        triggers: CSTriggerRecord[];
      },
    );
  return {
    value: {
      base: v,
      mods: modKeys,
      modded: res.value,
    },
    triggers: [
      ...res.triggers,
      ...modKeys.reduce(
        (acc, modKey) => [
          ...acc,
          {
            eventName: enums.CSEventNames.MODIFIER_DELETED,
            origin: modKey,
          },
        ],
        [] as CSTriggerRecord[],
      ),
    ],
  };
};

// export const calcModdedString = (
  // s: string,
  // mods: StringModifier[],
// ): ModdableString => {
  // if (mods.length === 0) {
    // return s;
  // }
  // return {
    // base: s,
    // mods,
    // modded: mods.reduce((acc, m) => acc + m, s),
  // };
// };

export const calcModdedString = (s,_mods):string => s

export const getModdedValue = (v: ModdableValue): number => {
  if (typeof v === 'number') {
    return v;
  }
  return v.modded;
};

export const getModdedString = (s: ModdableString): string => {
  if (typeof s === 'string') {
    return s;
  }
  return s.modded;
};

export const getBaseValue = (v: ModdableValue): number => {
  if (typeof v === 'number') {
    return v;
  }
  return v.base;
};

export const getBaseString = (s: ModdableString): string => {
  if (typeof s === 'string') {
    return s;
  }
  return s.base;
};

export const stringToValidKey = (s: string): string => s.trim().replace(/[-\s]/g, '_');

// COST TABLE FUNCTIONS
export const costMapLevelToPoints = (
  table: CostLevelMap,
  lvl: number,
): number => {
  const { flat, perLvl, progression, custom } = table;

  const ptsFromFlat = flat || 0;
  const ptsFromProgression = table.progression !== undefined && lvl !== 0
    ? progression[Math.min(progression.length, lvl) - 1]
    : 0;
  const ptsFromLevel = perLvl !== undefined && lvl !== 0
    ? progression !== undefined
      ? Math.max(0, lvl - progression.length)
          * (progression[0] < 0 && perLvl > 0 ? perLvl * -1 : perLvl)
      : perLvl * lvl
    : 0;
  const ptsFromCustom = custom || 0;

  return ptsFromFlat + ptsFromProgression + ptsFromLevel + ptsFromCustom;
};

export const costMapPointsToLevel = (
  table: CostLevelMap,
  points: number,
): number => {
  const { flat, perLvl, progression, custom } = table;

  if (progression === undefined && perLvl === undefined) {
    return 0;
  }

  const ptsAfterFlats = points - (flat || 0) - (custom || 0);

  if (progression !== undefined && perLvl !== undefined) {
    const lvlsFromProgression = progression.reduce(
      (acc, val, i) => (Math.abs(val) <= Math.abs(ptsAfterFlats) ? i + 1 : acc),
      0,
    );
    if (lvlsFromProgression !== progression.length) {
      return lvlsFromProgression;
    }
    return (
      lvlsFromProgression
      + Math.trunc((ptsAfterFlats - progression[progression.length - 1]) / perLvl)
    );
  }

  if (progression !== undefined) {
    return progression.reduce(
      (acc, val, i) => (Math.abs(val) <= Math.abs(ptsAfterFlats) ? i + 1 : acc),
      0,
    );
  }
  return Math.trunc(ptsAfterFlats / perLvl);
};

export const triggerListToListeners = (
  triggers: CSTriggerRecord[],
  funcID: string,
  listeningCharKey: string,
  listeningCharType: enums.CharacteristicType,
): CSListenerRecord[] => _.uniq([...triggers]).map((x) => ({
  ...x,
  funcID,
  listeningCharKey,
  listeningCharType,
}));

export const calcDerivedString = (
  d: DerivedString,
  state: CharacterState,
  context?: { subject?: Characteristic },
): DerivedStringResult => {
  if (typeof d === 'string') {
    return { text: d, string: d, updateTriggers: [] };
  }
  switch (d.type) {
    case enums.DerivedStringType.STRING:
      return { text: d.value, string: d.value, updateTriggers: [] };
    case enums.DerivedStringType.CHARACTERISTIC:
      return calcDerivedStringFromCharacteristic(d, state, context);
    default:
      throw new Error('unrecognized type');
  }
};

export const getComparatorEvents = (
  c: Comparator,
  env: Environment,
  state: CharacterState,
): { subjectEvents: CSTriggerRecord[]; externalEvents: CSTriggerRecord[] } => {
  switch (c.type) {
    case 'auto':
      return { subjectEvents: [], externalEvents: [] };
    case 'string': {
      const a = getDerivedStringEvents(c.a, env, state);
      const b = getDerivedStringEvents(c.b, env, state);
      return {
        subjectEvents: [...a.subjectEvents, ...b.subjectEvents],
        externalEvents: [...a.externalEvents, ...b.externalEvents],
      };
    }
    case 'value': {
      const a = getDerivedValueEvents(c.a, env, state);
      const b = getDerivedValueEvents(c.b, env, state);
      return {
        subjectEvents: [...a.subjectEvents, ...b.subjectEvents],
        externalEvents: [...a.externalEvents, ...b.externalEvents],
      };
    }
    case 'logic': {
      return c.selectors.reduce(
        (acc, sel) => {
          const res = getComparatorEvents(sel, env, state);
          return {
            subjectEvents: [...acc.subjectEvents, ...res.subjectEvents],
            externalEvents: [...acc.externalEvents, ...res.externalEvents],
          };
        },
        { subjectEvents: [], externalEvents: [] },
      );
    }
    default:
      throw new Error('unrecognized type');
  }
};

export const getDerivedStringEvents = (
  d: DerivedString,
  env: Environment,
  state: CharacterState,
): { subjectEvents: CSTriggerRecord[]; externalEvents: CSTriggerRecord[] } => {
  if (typeof d === 'string') {
    return { subjectEvents: [], externalEvents: [] };
  }
  switch (d.type) {
    case enums.DerivedStringType.STRING:
      return { subjectEvents: [], externalEvents: [] };
    case enums.DerivedStringType.CHARACTERISTIC:
      return getDerivedStringCharacteristicEvents(d, env, state);
    default:
      throw new Error('unrecognized type');
  }
};

const getDerivedStringCharacteristicEvents = (
  b: DerivedStringCharacteristic,
  env: Environment,
  state: CharacterState,
): { subjectEvents: CSTriggerRecord[]; externalEvents: CSTriggerRecord[] } => {
  const charTypeSettings = env.ruleset.characteristics[b.charType];
  const propSettings = charTypeSettings.selectableValues?.[b.property];
  if (b.key === '__subject') {
    if (propSettings === undefined) {
      return {
        subjectEvents: [{ eventName: propSettings.changeEvent }],
        externalEvents: [],
      };
    }
  }
  if (state.character[b.charType][b.key] === undefined) {
    const fb = getDerivedStringEvents(b.fallback, env, state);
    return {
      subjectEvents: [...fb.subjectEvents],
      externalEvents: [
        ...fb.externalEvents,
        {
          eventName: charTypeSettings.createEvent,
          origin: b.key,
        },
      ],
    };
  }
  return {
    subjectEvents: [
      { eventName: propSettings.changeEvent, origin: b.key },
      {
        eventName: charTypeSettings.deleteEvent,
        origin: b.key,
      },
    ],
    externalEvents: [],
  };
};

export const getDerivedValueEvents = (
  b: DerivedValue,
  env: Environment,
  state: CharacterState,
): { subjectEvents: CSTriggerRecord[]; externalEvents: CSTriggerRecord[] } => {
  if (typeof b === 'number') {
    return { subjectEvents: [], externalEvents: [] };
  }
  switch (b.type) {
    case enums.DerivedValueType.VALUE:
      return { subjectEvents: [], externalEvents: [] };
    case enums.DerivedValueType.CHARACTERISTIC:
      return getDerivedValueCharacteristicEvents(b, env, state);
    case enums.DerivedValueType.BRACKET:
      return getDerivedValueBracketEvents(b, env, state);
    default:
      throw new Error('unrecognized type');
  }
};

const getDerivedValueBracketEvents = (
  b: DerivedValueBracket,
  env: Environment,
  state: CharacterState,
): { subjectEvents: CSTriggerRecord[]; externalEvents: CSTriggerRecord[] } => b.values.reduce(
  (acc, val) => {
    const evs = getDerivedValueEvents(val, env, state);
    return {
      subjectEvents: [...acc.subjectEvents, ...evs.subjectEvents],
      externalEvents: [...acc.externalEvents, ...evs.externalEvents],
    };
  },
  { subjectEvents: [], externalEvents: [] },
);

const getDerivedValueCharacteristicEvents = (
  b: DerivedValueCharacteristic,
  env: Environment,
  state: CharacterState,
): { subjectEvents: CSTriggerRecord[]; externalEvents: CSTriggerRecord[] } => {
  const charTypeSettings = env.ruleset.characteristics[b.charType];
  const propSettings = charTypeSettings.selectableValues?.[b.property];
  if (b.key === '__subject') {
    if (propSettings === undefined) {
      return {
        subjectEvents: [{ eventName: propSettings.changeEvent }],
        externalEvents: [],
      };
    }
  }
  if (state.character[b.charType][b.key] === undefined) {
    const fb = getDerivedValueEvents(b.fallback, env, state);
    return {
      subjectEvents: [...fb.subjectEvents],
      externalEvents: [
        ...fb.externalEvents,
        {
          eventName: charTypeSettings.createEvent,
          origin: b.key,
        },
      ],
    };
  }
  return {
    subjectEvents: [
      { eventName: propSettings.changeEvent, origin: b.key },
      {
        eventName: charTypeSettings.deleteEvent,
        origin: b.key,
      },
    ],
    externalEvents: [],
  };
};

// BASE FUNCTIONS
export const calcDerivedValue = (
  b: DerivedValue,
  env: Environment,
  state: CharacterState,
  context?: { parent?: string; subject?: Characteristic },
): DerivedValueResult => {
  if (typeof b === 'number') {
    return { text: b.toString(), value: b, updateTriggers: [] };
  }
  switch (b.type) {
    case enums.DerivedValueType.VALUE:
      return {
        text: b.value.toString(),
        value: b.value,
        updateTriggers: [],
      };
    case enums.DerivedValueType.BRACKET:
      return calcBracket(b, state, context);
    case enums.DerivedValueType.CHARACTERISTIC:
      return calcDerivedValueFromCharacteristic(b, env, state, context);
    default:
      throw new Error(`Calculating base - invalid base: ${b}`);
  }
};

const calcBracket = (
  b: DerivedValueBracket,
  state: CharacterState,
  context?: { parent?: string; subject?: Characteristic },
): DerivedValueResult => {
  if (b.values.length !== b.operands.length + 1) {
    throw new Error(
      `Bracket evaluation failed: ${b.values.length} values but ${b.operands.length} operands.`,
    );
  }
  const calculatedValues = b.values.map((x) => calcDerivedValue(x, state, context));
  const updateTriggers = calculatedValues.reduce(
    (acc, cvr) => [...acc, ...(cvr.updateTriggers || [])],
    [],
  );

  const helper = (values: number[], operands: string[]) => {
    if (values.length === 1 || operands.length === 0) {
      return values[0];
    }
    const operandPos = Math.max(
      operands.findIndex((x) => x === 'x' || x === '/'),
      0,
    );
    const result = arithmetic(
      operands[operandPos],
      values[operandPos],
      values[operandPos + 1],
    );
    const remOperands = [
      ...operands.slice(0, operandPos),
      ...operands.slice(operandPos + 1),
    ];
    const remValues = [
      ...values.slice(0, operandPos),
      result,
      ...values.slice(operandPos + 2),
    ];
    return helper(remValues, remOperands);
  };

  const result = helper(
    calculatedValues.map((x) => x.value),
    b.operands,
  );

  return {
    text: `( ${[
      ...b.operands.map((x, i) => `${calculatedValues[i].text} ${x}`),
      calculatedValues[calculatedValues.length - 1].text,
    ].join(' ')} )`,
    value: result,
    updateTriggers: _.uniq(updateTriggers),
  };
};

const calcDerivedValueFromCharacteristic = (
  o: DerivedValueCharacteristic,
  env: Environment,
  state: CharacterState,
  context?: { subject?: Characteristic },
): DerivedValueResult => {
  const charSetting = env.ruleset.characteristics[o.charType];
  const propSetting = charSetting.selectableValues[o.property];
  if (propSetting === undefined) {
    throw new Error(`${o.property} is not retrievable value on ${o.charType}`);
  }
  if (propSetting.type !== 'value' && propSetting.type !== 'moddableValue') {
    throw new Error(
      `${o.property} of ${o.charType} is not valid property type`,
    );
  }

  // determine if this is a modifier subject value - often used for tests or relative adjustments.
  const isSubject = o.key === '__subject';

  // retrieve the correct attribute, accounting for Parent / Subject linkages.
  const obj = isSubject
    ? context.subject
    : (_.get(o.key)(state.character[o.charType]) as Characteristic);

  if (obj === undefined) {
    const fb = calcDerivedValue(o.fallback, state, context);
    return {
      text: fb.text,
      value: fb.value,
      updateTriggers: [
        ...fb.updateTriggers,
        ...(!isSubject
          ? [
            {
              eventName: charSetting.createEvent,
              origin: o.key,
            },
          ]
          : []),
      ],
    };
  }

  const value = o.unmodded
    ? getBaseValue(obj[o.property])
    : getModdedValue(obj[o.property]);

  return {
    text: propSetting.stringFunc(obj),
    value,
    updateTriggers: !isSubject
      ? [
        {
          eventName: charSetting.deleteEvent,
          origin: o.key,
        },
        {
          eventName: propSetting.changeEvent,
          origin: o.key,
        },
      ]
      : [],
  };
};

const calcDerivedStringFromCharacteristic = (
  o: DerivedStringCharacteristic,
  state: CharacterState,
  context?: { subject?: Characteristic },
): DerivedStringResult => {
  const charSetting = characteristicSettings[o.charType];
  const propSetting = charSetting.selectableValues[o.property];
  if (propSetting === undefined) {
    throw new Error(`${o.property} is not retrievable value on ${o.charType}`);
  }
  if (propSetting.type !== 'string' && propSetting.type !== 'moddableString') {
    throw new Error(
      `${o.property} of ${o.charType} is not valid property type`,
    );
  }

  // determine if this is a modifier subject value - often used for tests or relative adjustments.
  const isSubject = o.key === '__subject';

  // retrieve the correct attribute, accounting for Parent / Subject linkages.
  const obj = isSubject
    ? context.subject
    : (_.get(o.key)(state.character[o.charType]) as Characteristic);

  if (obj === undefined) {
    const fb = calcDerivedString(o.fallback, state, context);
    return {
      text: fb.text,
      string: fb.string,
      updateTriggers: [
        ...fb.updateTriggers,
        ...(!isSubject
          ? [
            {
              eventName: charSetting.createEvent,
              origin: o.key,
            },
          ]
          : []),
      ],
    };
  }

  const string = obj[o.property];

  return {
    text: propSetting.stringFunc(obj),
    string,
    updateTriggers: !isSubject
      ? [
        {
          eventName: charSetting.deleteEvent,
          origin: o.key,
        },
        {
          eventName: propSetting.changeEvent,
          origin: o.key,
        },
      ]
      : [],
  };
};

/**
 * Retrieves the characteristic from a given Character State.
 * Will error if object is not found.
 * @param key The known key or uuid of the characteristic
 * @param type The Characteristic Type
 * @param state The Character State
 * @returns 
 */
export const getCharacteristic = <T extends Characteristic>(key:string, type:enums.CharacteristicType, character: Character): T => {
  const obj = character[type][key]
  if(obj === undefined) {
    throw new Error(`${type} (${key}) not found.`)
  }
  return obj;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const withoutEmptyArray = (arr: any[], key: string) => {
  if (arr.length === 0) return {};
  return { [key]: arr };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const withoutEmptyObject = (obj: any, key: string) => {
  if (Object.keys(obj).length === 0) return {};
  return { [key]: obj };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nanoidAlpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
// const nanoid = customAlphabet(nanoidAlpha,12)
const nanoid = () => 'abcdef';
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const generateID = () => nanoid();

export const testComparator = (
  c: Comparator,
  state: CharacterState,
  context?: { subject: Characteristic },
): boolean => {
  const valueTest = (s: ComparatorValue): boolean => {
    const derivedA = calcDerivedValue(s.a, state, context).value;
    const derivedB = calcDerivedValue(s.b, state, context).value;
    switch (s.comparator) {
      case '=':
        return derivedA === derivedB;
      case '>':
        return derivedA > derivedB;
      case '<':
        return derivedA < derivedB;
      case '!=':
        return derivedA !== derivedB;
      default:
        throw new Error(`Unrecognized Value Comparator ${s.comparator}`);
    }
  };

  const stringTest = (s: ComparatorString): boolean => {
    const a = calcDerivedString(s.a, state, context).string;
    const b = calcDerivedString(s.b, state, context).string;
    switch (s.comparator) {
      case 'regex':
        return RegExp(b).test(a);
      case 'includes':
        return a.includes(b);
      case 'is':
        return a === b;
      default:
        return false;
    }
  };

  const logicalTest = (s: ComparatorLogic): boolean => {
    switch (s.operator) {
      case 'OR':
        return s.selectors.reduce(
          (result, filter) => (result === false ? testComparator(filter, state, context) : true),
          false,
        );
      case 'AND':
        return s.selectors.reduce(
          (result, filter) => (result === true ? testComparator(filter, state, context) : false),
          true,
        );
      case 'NOR':
        return !s.selectors.reduce(
          (result, filter) => (result === false ? testComparator(filter, state, context) : true),
          false,
        );
      default:
        throw new Error(`Unrecognized Logical operator: ${s.operator}`);
    }
  };

  switch (c.type) {
    case 'string':
      return stringTest(c);
    case 'value':
      return valueTest(c);
    case 'logic':
      return logicalTest(c);
    case 'auto':
      return c.result;
    default:
      throw new Error(`Unrecognized Filter Type: ${c.type}`);
  }
};
