import _ from 'lodash/fp';
import type {
  Attribute,
  CSAction,
  CSEvent,
  CharacterState,
  Environment,
  InsertOptions,
  CSTriggerRecord,
  CharacteristicDefinition,
  Ruleset,
  CSActionResult,
  CharacteristicEventResponseMap,
  CSEventResponse,
} from './types';
import {
  calcDerivedValue,
  calcModdedValue,
  costMapPointsToLevel,
  getCharacteristic,
  getModdedValue,
  getMods,
  stringToValidKey,
} from './utility';
import { CSEventNames, CharacteristicType } from './enums';
import { updateRegistry } from './eventSystem';

const calculateLevel = (
  a: Attribute,
  k: string,
  state: CharacterState,
  rs: Ruleset,
): { a: Attribute; baseListeners: CSTriggerRecord[] } => {
  const Base = calcDerivedValue(a.base, state, rs);
  const BoughtLevels = costMapPointsToLevel(
    a.levelMap,
    getModdedValue(a.points),
  );
  const Level = Base.value + BoughtLevels + a.lvlMod;
  const mods = getMods(CharacteristicType.ATTRIBUTES, k, 'lvl', state);
  const ModdedLevel = calcModdedValue(a, Level, mods, state, rs);
  const newAttr = {
    ...a,
    lvlBase: Base.value,
    lvl: ModdedLevel.value,
    lvlPurchase: BoughtLevels,
  };
  return {
    a: newAttr,
    baseListeners: [...Base.updateTriggers, ...ModdedLevel.triggers],
  };
};

export const updateLevel = (key: string): CSAction => (state: CharacterState, rs: Ruleset, _env:Environment) => {
  console.info(`Attribute Update Level called`)
  const { character, registry } = state;
  const a = getCharacteristic<Attribute>(key,CharacteristicType.ATTRIBUTES,character)
  const calced = calculateLevel(a, key, state, rs);
  return {
    state: {
      character: _.set(
        ['characteristics',CharacteristicType.ATTRIBUTES, key],
        calced.a,
      )(character),
      registry: updateRegistry(
        registry,
        calced.baseListeners,
        'updateLevel',
        key,
        CharacteristicType.ATTRIBUTES,
      ),
    },
    events:
        a.lvl !== calced.a.lvl
          ? [
            {
              name: CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
              origin: key,
              data: calced.a.lvl,
            },
          ]
          : [],
  };
};

// export const insert = (k:string, a:Attribute): CSAction => (state: CharacterState, rs: Ruleset, env:Environment) => {
//   const { character, registry } = state;
//   const calced = calculateLevel(a, k, state, rs);
//   return {
//     state: {
//       character: _.set(`attributes.${k}`, calced.a)(character),
//       registry: updateRegistry(
//         registry,
//         calced.baseListeners,
//         'updateLevel',
//         `attributes.${k}`,
//         CharacteristicType.ATTRIBUTES,
//       ),
//     },
//     events: [
//       {
//         name: CSEventNames.ATTRIBUTE_CREATED,
//         origin: k,
//       },
//     ],
//   };
// }

// export const insertXX = (a: Attribute, opts: InsertOptions): CSAction => (state: CharacterState, rs: Ruleset, env:Environment) => {
//   const { character, registry } = state;
//   const defaultKey = stringToValidKey(a.name);
//   if (character.characteristics.attributes[defaultKey] !== undefined) {
//     const method = opts.conflictMethod === 'prompt'
//       ? env.prompter.select(
//         {
//           title: '',
//           description: '',
//           permitCancel: false,
//         },
//         [],
//         'overwrite',
//       )
//       : opts.conflictMethod;
//     switch (method) {
//       case 'overwrite': {
//         const calced = calculateLevel(a, defaultKey, state, rs);
//         return {
//           state: {
//             character: _.set(`attributes.${defaultKey}`, calced.a)(character),
//             registry: updateRegistry(
//               registry,
//               calced.baseListeners,
//               'updateLevel',
//               defaultKey,
//               CharacteristicType.ATTRIBUTES,
//             ),
//           },
//           events: [
//             {
//               name: CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
//               origin: defaultKey,
//             },
//           ],
//         };
//       }
//       case 'ignore':
//         return { state: { character, registry }, events: [] };
//       default:
//         throw new Error(`Unhandled duplicate attribute on insert ${a.name}`);
//     }
//   }
//   const calced = calculateLevel(a, defaultKey, state, rs);
//   return {
//     state: {
//       character: _.set(`attributes.${defaultKey}`, calced.a)(character),
//       registry: updateRegistry(
//         registry,
//         calced.baseListeners,
//         'updateLevel',
//         `attributes.${defaultKey}`,
//         CharacteristicType.ATTRIBUTES,
//       ),
//     },
//     events: [
//       {
//         name: CSEventNames.ATTRIBUTE_CREATED,
//         origin: defaultKey,
//       },
//     ],
//   };
// };

export const definition: CharacteristicDefinition = {
  key: CharacteristicType.ATTRIBUTES,
  functions: {
    generateKey: (o:Attribute) => o.name,
    create: updateLevel
  },
  eventResponses: {
    updateLevel: (path: string, _event: CSEvent) => updateLevel(path),
  },
  createEvent: CSEventNames.ATTRIBUTE_CREATED,
  deleteEvent: CSEventNames.ATTRIBUTE_DELETED,
  moddableValues: {
    lvl: {
      type: 'value',
      funcID: 'updateLevel',
      displayName: 'Level',
    },
  },
  queryableValues: {
    lvl: {
      displayName: 'Level',
      type: 'moddableValue',
      changeEvent: CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
      stringFunc: (obj: Attribute):string => obj.abbreviation || obj.name,
    },
    name: {
      displayName: 'Name',
      type: 'string',
      changeEvent: CSEventNames.ATTRIBUTE_NAME_CHANGED,
      stringFunc: (obj: Attribute):string => obj.name,
    },
  },
}
