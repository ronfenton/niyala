import _ from 'lodash/fp';
import { CSEventNames, CharacteristicType } from './enums';
import {
  CSTriggerRecord,
  CharacterState,
  Environment,
  Skill,
  CSAction,
  InsertOptions,
  CSEvent,
} from './types';
import {
  calcDerivedValue,
  costMapPointsToLevel,
  getModdedValue,
  getMods,
  calcModdedValue,
  getBaseValue,
  stringToValidKey,
} from './utility';
import { UpdateRegistry } from './eventSystem';

const calculateLevel = (
  s: Skill,
  k: string,
  env: Environment,
  state: CharacterState,
): { s: Skill; baseListeners: CSTriggerRecord[] } => {
  const Base = calcDerivedValue(s.base, state);
  const pts = calcModdedValue(
    s,
    getBaseValue(s.points),
    getMods(CharacteristicType.SKILLS, k, 'points', state),
    state,
  );
  const BoughtLevels = costMapPointsToLevel(
    { progression: [1, 2, 4], perLvl: 4 },
    getModdedValue(pts.value),
  );
  // TODO: Refactor this to allow for skill defaults.
  const Level = BoughtLevels === 0 && s.defaults.attribute !== undefined
    ? s.defaults.attribute + s.lvlMod
    : BoughtLevels + s.lvlMod + s.difficulty;
  const mods = getMods(CharacteristicType.SKILLS, k, 'lvl', state);
  const ModdedLevel = calcModdedValue(s, Level, mods, state);
  const newSkill:Skill = {
    ...s,
    lvlBase: Base.value,
    points: pts.value,
    lvl: ModdedLevel.value,
    disabled: BoughtLevels === 0 && s.defaults.attribute === undefined,
    lvlSkill: getModdedValue(ModdedLevel.value) + Base.value,
  };
  return {
    s: newSkill,
    baseListeners: [...Base.updateTriggers, ...ModdedLevel.triggers],
  };
};

const updateDefault = (s: Skill, k: string): CSAction => (env: Environment, state: CharacterState) => {
  if (s.points === 0) {
    // TODO: Implement
  }
  return {
    state,
    events: [],
  };
};

export const updateLevel = (key: string): CSAction => (env: Environment, state: CharacterState) => {
  const s = _.get(key)(state.character[CharacteristicType.SKILLS]) as Skill;
  if (s === undefined) {
    throw new Error(`Skill ${key} not found`);
  }
  const { character, registry } = state;
  const calced = calculateLevel(s, key, env, state);
  return {
    state: {
      character: _.set([CharacteristicType.SKILLS, key], calced.s)(character),
      registry: UpdateRegistry(
        registry,
        calced.baseListeners,
        'updateLevel',
        key,
        CharacteristicType.SKILLS,
      ),
    },
    events:
        s.lvl !== calced.s.lvl || s.lvlSkill !== calced.s.lvlSkill
          ? [
            {
              name: CSEventNames.SKILL_LEVEL_CHANGED,
              origin: `${CharacteristicType.SKILLS}.${key}`,
              data: calced.s.lvl,
            },
          ]
          : [],
  };
};

export const insert = (s: Skill, opts: InsertOptions): CSAction => (env: Environment, state: CharacterState) => {
  const { character, registry } = state;
  const defaultKey = stringToValidKey(
    s.name
        + (s.specialisation?.name !== undefined
          ? ` (${s.specialisation.name})`
          : ''),
  );
  if (character[CharacteristicType.SKILLS][defaultKey] !== undefined) {
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
        const calced = calculateLevel(s, defaultKey, env, state);
        return {
          state: {
            character: _.set(
              `${CharacteristicType.SKILLS}.${defaultKey}`,
              calced.s,
            )(character),
            registry: UpdateRegistry(
              registry,
              calced.baseListeners,
              'updateLevel',
              defaultKey,
              CharacteristicType.SKILLS,
            ),
          },
          events: [
            {
              name: CSEventNames.SKILL_LEVEL_CHANGED,
              origin: defaultKey,
            },
          ],
        };
      }
      case 'ignore':
        return { state: { character, registry }, events: [] };
      default:
        throw new Error(`Unhandled duplicate skill on insert ${s.name}`);
    }
  }
  const calced = calculateLevel(s, defaultKey, env, state);
  return {
    state: {
      character: _.set(
        `${CharacteristicType.SKILLS}.${defaultKey}`,
        calced.s,
      )(character),
      registry: UpdateRegistry(
        registry,
        calced.baseListeners,
        'updateLevel',
        `${CharacteristicType.SKILLS}.${defaultKey}`,
        CharacteristicType.SKILLS,
      ),
    },
    events: [
      {
        name: CSEventNames.SKILL_CREATED,
        origin: defaultKey,
      },
    ],
  };
};

export const SkillEventsHandler = {
  updateLevel: (
    env: Environment,
    state: CharacterState,
    key: string,
    _event: CSEvent,
  ) => updateLevel(key)(env, state),
};