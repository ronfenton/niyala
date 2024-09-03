import _ from 'lodash/fp';
import type {
  ObjectModifier,
  Environment,
  CharacterState,
  InsertOptions,
  CSAction,
  CSTriggerRecord,
  CSListenerRecord,
  CSEvent,
  CharacteristicEventResponseMap,
  Ruleset,
  CSEventResponse,
  CharacteristicDefinition,
} from './types';
import {
  generateID,
  getCharacteristic,
  getComparatorEvents,
  testComparator,
} from './utility';
import * as enums from './enums';
import { updateRegistry as updateRegistry } from './eventSystem';

// Updates registry with various registry events for the mod to update or check for new candidates.
const objectModRegistryHelper = (
  omKey: string,
  registry: CSListenerRecord[],
  filterChange: CSTriggerRecord[],
  filterSubject: CSTriggerRecord[],
): CSListenerRecord[] => {
  const a = updateRegistry(
    registry,
    filterChange,
    'reevaluateModifier',
    omKey,
    enums.CharacteristicType.OBJECT_MODIFIERS,
  );
  const b = updateRegistry(
    a,
    filterSubject,
    'testSubject',
    omKey,
    enums.CharacteristicType.OBJECT_MODIFIERS,
  );
  return b;
};

/**
 * Returns all triggers that will either provoke the filter itself to change 
 * (filter change) or that might make a subject eligible (filter subject)
 * @param o 
 * @param state 
 * @param rs 
 * @returns 
 */
const evaluateTriggers = (
  o: ObjectModifier,
  state: CharacterState,
  rs: Ruleset,
): {
  filterSubjectTriggers: CSTriggerRecord[];
  filterChangeTriggers: CSTriggerRecord[];
} => {
  const filterTriggers = getComparatorEvents(o.selector.filter, state, rs);
  switch (o.effect.effectType) {
    case enums.ModifierEffectType.VALUE:
      return {
        filterSubjectTriggers: [
          ...filterTriggers.subjectEvents,
          {
            eventName: rs.characteristics[o.selector.charType].createEvent,
          },
        ],
        filterChangeTriggers: filterTriggers.externalEvents,
      };
    case enums.ModifierEffectType.STRING:
      return {
        filterSubjectTriggers: [
          ...filterTriggers.subjectEvents,
          {
            eventName: rs.characteristics[o.selector.charType].createEvent,
          },
        ],
        filterChangeTriggers: filterTriggers.externalEvents,
      };
    default:
      throw new Error('unrecognized effect type');
  }
};

// For a given object (given by type and key), remove provided modifier ID if existing from register for given key.
const unsubscribe = (
  characteristicType: enums.CharacteristicType,
  characteristicKey: string,
  modifierKey: string,
  subjectProperty: string,
  state: CharacterState,
  rs: Ruleset,
): CharacterState => {
  const existingModifiers = state.character.objectModifierRegister?.[characteristicType]?.[
    characteristicKey
  ]?.[subjectProperty];
  if (
    existingModifiers === undefined
    || !existingModifiers.includes(modifierKey)
  ) {
    // no change needed. skip
    return state;
  }
  const unlinked = _.set(
    `character.objectModifierRegister.${characteristicType}.${characteristicKey}.${subjectProperty}`,
  )(_.without([modifierKey])(existingModifiers), state);
  return {
    ...unlinked,
    registry: [
      ...state.registry,
      {
        eventName: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: modifierKey,
        listeningCharKey: characteristicKey,
        listeningCharType: characteristicType,
        funcID:
          rs.characteristics[characteristicType].moddableValues[
            subjectProperty
          ].funcID,
      },
    ],
  };
};

// for a given object (given by type and key), add provided modifier ID if not existing into register for given key.
const subscribe = (
  characteristicType: enums.CharacteristicType,
  characteristicKey: string,
  modifierKey: string,
  subjectProperty: string,
  state: CharacterState,
  rs: Ruleset,
): CharacterState => {
  if (
      rs.characteristics[characteristicType].moddableValues[
      subjectProperty
    ] === undefined
  ) {
    throw new Error(
      `Property ${subjectProperty} on object type ${characteristicType} is not defined or modifiable`,
    );
  }
  const existingModifiers = state.character.objectModifierRegister?.[characteristicType]?.[
    characteristicKey
  ]?.[subjectProperty];
  if (
    existingModifiers !== undefined
    && existingModifiers.includes(modifierKey)
  ) {
    // no change needed. skip
    return state;
  }
  const linked = _.set(
    `character.objectModifierRegister.${characteristicType}.${characteristicKey}.${subjectProperty}`,
  )([modifierKey, ...(existingModifiers || [])], state);
  return {
    ...linked,
    registry: [
      ...state.registry,
      {
        eventName: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: modifierKey,
        listeningCharKey: characteristicKey,
        listeningCharType: characteristicType,
        funcID:
          rs.characteristics[characteristicType].moddableValues[
            subjectProperty
          ].funcID,
      },
    ],
  };
};


const updateSubjectSubscription = (
  om: ObjectModifier,
  modifierKey: string,
  charKeys: string[],
  state: CharacterState,
  rs: Ruleset,
): CharacterState => {
  const newState = charKeys.reduce((accState, characteristicKey) => {
    if ((om.selector.excludeKeys || []).includes(characteristicKey)) {
      return unsubscribe(
        om.selector.charType,
        characteristicKey,
        modifierKey,
        om.effect.targetProp,
        accState,
        rs,
      );
    }
    if (
      om.selector.limitKeys !== undefined
      && !om.selector.limitKeys.includes(characteristicKey)
    ) {
      return unsubscribe(
        om.selector.charType,
        characteristicKey,
        modifierKey,
        om.effect.targetProp,
        accState,
        rs,
      );
    }
    if (om.selector.filter === undefined) {
      return subscribe(
        om.selector.charType,
        characteristicKey,
        modifierKey,
        om.effect.targetProp,
        accState,
        rs,
      );
    }
    const obj = state.character.characteristics[om.selector.charType][characteristicKey];
    if (testComparator(om.selector.filter, accState, rs, { subject: obj })) {
      return subscribe(
        om.selector.charType,
        characteristicKey,
        modifierKey,
        om.effect.targetProp,
        accState,
        rs,
      );
    }
    return unsubscribe(
      om.selector.charType,
      characteristicKey,
      modifierKey,
      om.effect.targetProp,
      accState,
      rs,
    );
  }, state);
  return newState;
};

const updateSubjects = (
  om: ObjectModifier,
  modifierKey: string,
  state: CharacterState,
  rs: Ruleset,
) => {
  const candidates = om.selector.limitKeys !== undefined && om.selector.limitKeys.length !== 0
    ? om.selector.limitKeys
    : Object.keys(state.character.characteristics[om.selector.charType]);

  return updateSubjectSubscription(om, modifierKey, candidates, state, rs);
};

const reevaluateModifier:CSEventResponse = (key: string):CSAction => (state: CharacterState, rs: Ruleset, env: Environment) => {
  const om = getCharacteristic<ObjectModifier>(key,enums.CharacteristicType.OBJECT_MODIFIERS,state.character);
  const triggers = evaluateTriggers(om, state, rs);
  const registryUpd = _.set(
    'registry',
    objectModRegistryHelper(
      key,
      state.registry,
      triggers.filterChangeTriggers,
      triggers.filterSubjectTriggers,
    ),
  )(state);
  return {
    state: updateSubjects(om, key, registryUpd, rs),
    events: [
      {
        name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: key,
      },
    ],
  };
}

const reevaluateSubjects = (
  key: string,
  event: CSEvent,
  state: CharacterState,
  rs: Ruleset,
  env: Environment,
): { state: CharacterState; events: CSEvent[] } => {
  const om = state.character[enums.CharacteristicType.OBJECT_MODIFIERS][key];
  const triggers = evaluateTriggers(om, state, rs);
  const registryUpd = _.set(
    'registry',
    objectModRegistryHelper(
      key,
      state.registry,
      triggers.filterChangeTriggers,
      triggers.filterSubjectTriggers,
    ),
  )(state);
  return {
    state: updateSubjects(om, key, registryUpd, rs),
    events: [
      {
        name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: key,
      },
    ],
  };
};

const testSubject:CSEventResponse = (
  key: string,
  event: CSEvent):CSAction => (
  state: CharacterState,
  rs: Ruleset,
  env: Environment,
): { state: CharacterState; events: CSEvent[] } => {
  const om = state.character[enums.CharacteristicType.OBJECT_MODIFIERS][key];
  return {
    state: updateSubjectSubscription(om, key, [event.origin], state, rs),
    events: [
      {
        name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: key,
      },
    ],
  };
};

const testPossibleSubject = (
  key: string,
  event: CSEvent,
  state: CharacterState,
  rs: Ruleset,
  env: Environment,
): { state: CharacterState; events: CSEvent[] } => {
  const om = state.character[enums.CharacteristicType.OBJECT_MODIFIERS][key];
  return {
    state: updateSubjectSubscription(om, key, [event.origin], state, rs),
    events: [
      {
        name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: key,
      },
    ],
  };
};

export const createPostProcess = (k: string, om: ObjectModifier): CSAction => (state: CharacterState, rs: Ruleset, env: Environment) => {
  const triggers = evaluateTriggers(om, state, rs);
  const registryUpd = _.set(
    'registry',
    objectModRegistryHelper(
      k,
      state.registry,
      triggers.filterChangeTriggers,
      triggers.filterSubjectTriggers,
    ),
  )(state);
  return {
    state: updateSubjects(om, k, registryUpd, rs),
    events: [
      {
        name: enums.CSEventNames.MODIFIER_CREATED,
        origin: k,
      },
      {
        name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: k,
      },
    ],
  };
}

export const insertxxx = (om: ObjectModifier, opts: InsertOptions): CSAction => (state: CharacterState, rs: Ruleset, env: Environment) => {
  const newKey = opts.keyOverride || generateID();
  const inserted = _.set(
    `character.${enums.CharacteristicType.OBJECT_MODIFIERS}.${newKey}`,
    om,
  )(state);
  const triggers = evaluateTriggers(om, inserted, rs);
  const registryUpd = _.set(
    'registry',
    objectModRegistryHelper(
      newKey,
      inserted.registry,
      triggers.filterChangeTriggers,
      triggers.filterSubjectTriggers,
    ),
  )(inserted);
  return {
    state: updateSubjects(om, newKey, registryUpd, rs),
    events: [
      {
        name: enums.CSEventNames.MODIFIER_CREATED,
        origin: newKey,
      },
      {
        name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: newKey,
      },
    ],
  };
};

export const editFilter = (om: ObjectModifier, key: string): CSAction => (state: CharacterState, rs: Ruleset, env: Environment) => {
  const oldOM = state.character[enums.CharacteristicType.OBJECT_MODIFIERS][key];
  const [oldLimits, newLimits] = [
    oldOM.selector.limitKeys || [],
    om.selector.limitKeys || [],
  ];
  const sameLimits = oldLimits.length === newLimits.length
      && oldLimits.every((x) => newLimits.includes(x));
  if (sameLimits) {
    return {
      state: updateSubjectSubscription(om, key, newLimits, state, rs),
      events: [
        {
          name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
          origin: key,
        },
      ],
    };
  }
  return {
    state: updateSubjectSubscription(
      om,
      key,
      Object.keys(state.character[om.selector.charType]),
      _.set(
        ['character', enums.CharacteristicType.OBJECT_MODIFIERS, key],
        om,
      )(state),
      rs,
    ),
    events: [
      {
        name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: key,
      },
    ],
  };
};

export const ObjectModsEventHandler: CharacteristicEventResponseMap = {
  reevaluateModifier,
  testSubject,
};

export const definition: CharacteristicDefinition = {
  key: enums.CharacteristicType.OBJECT_MODIFIERS,
  functions: {
    create: createPostProcess,
    generateKey: generateID,
  },
  eventResponses: {
    reevaluateModifier,
    testSubject,
  },
  createEvent: enums.CSEventNames.MODIFIER_CREATED,
  deleteEvent: enums.CSEventNames.MODIFIER_DELETED,
  moddableValues: {},
  queryableValues: {}
}