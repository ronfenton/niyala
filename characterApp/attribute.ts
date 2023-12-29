import _ from 'lodash/fp';
import type {
  Attribute,
  CSAction,
  CSEvent,
  CharacterState,
  Environment,
  InsertOptions,
  CSTriggerRecord,
} from './types';
import {
  calcDerivedValue,
  calcModdedValue,
  costMapPointsToLevel,
  getModdedValue,
  getMods,
  stringToValidKey,
} from './utility';
import { CSEventNames, CharacteristicType } from './enums';
import { UpdateRegistry } from './eventSystem';

const calculateLevel = (
  a: Attribute,
  k: string,
  env: Environment,
  state: CharacterState,
): { a: Attribute; baseListeners: CSTriggerRecord[] } => {
  const Base = calcDerivedValue(a.base, state);
  const BoughtLevels = costMapPointsToLevel(
    a.levelMap,
    getModdedValue(a.points),
  );
  const Level = Base.value + BoughtLevels + a.lvlMod;
  const mods = getMods(CharacteristicType.ATTRIBUTES, k, 'lvl', state);
  const ModdedLevel = calcModdedValue(a, Level, mods, state);
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

export const updateLevel = (key: string): CSAction => (env: Environment, state: CharacterState) => {
  const a = _.get(key)(state.character[CharacteristicType.ATTRIBUTES]);
  if (a === undefined) {
    throw new Error(`Attribute ${key} not found`);
  }
  const { character, registry } = state;
  const calced = calculateLevel(a, key, env, state);
  return {
    state: {
      character: _.set(
        [CharacteristicType.ATTRIBUTES, key],
        calced.a,
      )(character),
      registry: UpdateRegistry(
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

export const insert = (a: Attribute, opts: InsertOptions): CSAction => (env: Environment, state: CharacterState) => {
  const { character, registry } = state;
  const defaultKey = stringToValidKey(a.name);
  if (character.attributes[defaultKey] !== undefined) {
    const method = opts.conflictMethod === 'prompt'
      ? env.prompter.select(
        {
          title: '',
          description: '',
          permitCancel: false,
        },
        [],
        'overwrite',
      )
      : opts.conflictMethod;
    switch (method) {
      case 'overwrite': {
        const calced = calculateLevel(a, defaultKey, env, state);
        return {
          state: {
            character: _.set(`attributes.${defaultKey}`, calced.a)(character),
            registry: UpdateRegistry(
              registry,
              calced.baseListeners,
              'updateLevel',
              defaultKey,
              CharacteristicType.ATTRIBUTES,
            ),
          },
          events: [
            {
              name: CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
              origin: defaultKey,
            },
          ],
        };
      }
      case 'ignore':
        return { state: { character, registry }, events: [] };
      default:
        throw new Error(`Unhandled duplicate attribute on insert ${a.name}`);
    }
  }
  const calced = calculateLevel(a, defaultKey, env, state);
  return {
    state: {
      character: _.set(`attributes.${defaultKey}`, calced.a)(character),
      registry: UpdateRegistry(
        registry,
        calced.baseListeners,
        'updateLevel',
        `attributes.${defaultKey}`,
        CharacteristicType.ATTRIBUTES,
      ),
    },
    events: [
      {
        name: CSEventNames.ATTRIBUTE_CREATED,
        origin: defaultKey,
      },
    ],
  };
};

export const AttributeEventsHandler = {
  updateLevel: (
    env: Environment,
    state: CharacterState,
    key: string,
    _event: CSEvent,
  ) => updateLevel(key)(env, state),
};
