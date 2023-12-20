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
  CharacteristicEventActionMap,
  Characteristic,
} from './types';
import {
  generateID,
  getComparatorEvents,
  getDerivedStringEvents,
  getDerivedValueEvents,
  testComparator,
} from './utility';
import { characteristicSettings } from './config';
import * as enums from './enums';
import { UpdateRegistry as updateRegistry } from './eventSystem';

const objectModRegistryHelper = (
  omKey: string,
  registry: CSListenerRecord[],
  filterChange: CSTriggerRecord[],
  filterSubject: CSTriggerRecord[],
): CSListenerRecord[] => {
  const a = updateRegistry(
    registry,
    filterChange,
    'reevaluateSubjects',
    omKey,
    enums.CharacteristicType.OBJECT_MODIFIERS,
  );
  const b = updateRegistry(
    a,
    filterSubject,
    'testPossibleSubject',
    omKey,
    enums.CharacteristicType.OBJECT_MODIFIERS,
  );
  return b;
};

const evaluateTriggers = (
  o: ObjectModifier,
  env: Environment,
  state: CharacterState,
): {
  filterSubjectTriggers: CSTriggerRecord[];
  filterChangeTriggers: CSTriggerRecord[];
} => {
  const filterTriggers = getComparatorEvents(o.selector.filter, state);
  switch (o.effect.effectType) {
    case enums.ModifierEffectType.VALUE:
      return {
        filterSubjectTriggers: [
          ...filterTriggers.subjectEvents,
          {
            eventName: characteristicSettings[o.selector.charType].createEvent,
          },
        ],
        filterChangeTriggers: filterTriggers.externalEvents,
      };
    case enums.ModifierEffectType.STRING:
      return {
        filterSubjectTriggers: [
          ...filterTriggers.subjectEvents,
          {
            eventName: characteristicSettings[o.selector.charType].createEvent,
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
          characteristicSettings[characteristicType].moddableValues[
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
): CharacterState => {
  if (
    characteristicSettings[characteristicType].moddableValues[
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
          characteristicSettings[characteristicType].moddableValues[
            subjectProperty
          ].funcID,
      },
    ],
  };
};

const updateSubjectSubscription = (
  om: ObjectModifier,
  modifierKey: string,
  state: CharacterState,
  charKeys: string[],
): CharacterState => {
  const newState = charKeys.reduce((accState, characteristicKey) => {
    if ((om.selector.excludeKeys || []).includes(characteristicKey)) {
      return unsubscribe(
        om.selector.charType,
        characteristicKey,
        modifierKey,
        om.effect.targetProp,
        accState,
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
      );
    }
    if (om.selector.filter === undefined) {
      return subscribe(
        om.selector.charType,
        characteristicKey,
        modifierKey,
        om.effect.targetProp,
        accState,
      );
    }
    const obj = state.character[om.selector.charType][characteristicKey];
    if (testComparator(om.selector.filter, accState, { subject: obj })) {
      return subscribe(
        om.selector.charType,
        characteristicKey,
        modifierKey,
        om.effect.targetProp,
        accState,
      );
    }
    return unsubscribe(
      om.selector.charType,
      characteristicKey,
      modifierKey,
      om.effect.targetProp,
      accState,
    );
  }, state);
  return newState;
};

const updateSubjects = (
  om: ObjectModifier,
  modifierKey: string,
  state: CharacterState,
) => {
  const candidates = om.selector.limitKeys !== undefined && om.selector.limitKeys.length !== 0
    ? om.selector.limitKeys
    : Object.keys(state.character[om.selector.charType]);

  return updateSubjectSubscription(om, modifierKey, state, candidates);
};

const reevaluateSubjects = (
  env: Environment,
  state: CharacterState,
  key: string,
  event: CSEvent,
): { state: CharacterState; events: CSEvent[] } => {
  const om = state.character[enums.CharacteristicType.OBJECT_MODIFIERS][key];
  const triggers = evaluateTriggers(om, env, state);
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
    state: updateSubjects(om, key, registryUpd),
    events: [
      {
        name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: key,
      },
    ],
  };
};

const testPossibleSubject = (
  env: Environment,
  state: CharacterState,
  key: string,
  event: CSEvent,
): { state: CharacterState; events: CSEvent[] } => {
  const om = state.character[enums.CharacteristicType.OBJECT_MODIFIERS][key];
  return {
    state: updateSubjectSubscription(om, key, state, [event.origin]),
    events: [
      {
        name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: key,
      },
    ],
  };
};

export const insert = (om: ObjectModifier, opts: InsertOptions): CSAction => (env: Environment, state: CharacterState) => {
  const newKey = opts.keyOverride || generateID();
  const inserted = _.set(
    `character.${enums.CharacteristicType.OBJECT_MODIFIERS}.${newKey}`,
    om,
  )(state);
  const triggers = evaluateTriggers(om, env, inserted);
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
    state: updateSubjects(om, newKey, registryUpd),
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

export const editFilter = (om: ObjectModifier, key: string): CSAction => (env: Environment, state: CharacterState) => {
  const oldOM = state.character[enums.CharacteristicType.OBJECT_MODIFIERS][key];
  const [oldLimits, newLimits] = [
    oldOM.selector.limitKeys || [],
    om.selector.limitKeys || [],
  ];
  const sameLimits = oldLimits.length === newLimits.length
      && oldLimits.every((x) => newLimits.includes(x));
  if (sameLimits) {
    return {
      state: updateSubjectSubscription(om, key, state, newLimits),
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
      _.set(
        ['character', enums.CharacteristicType.OBJECT_MODIFIERS, key],
        om,
      )(state),
      Object.keys(state.character[om.selector.charType]),
    ),
    events: [
      {
        name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        origin: key,
      },
    ],
  };
};

export const ObjectModsEventHandler: CharacteristicEventActionMap = {
  reevaluateSubjects,
  testPossibleSubject,
};
