import { describe, expect, it } from '@jest/globals';
import _ from 'lodash/fp';
import * as fixtures from './fixtures';
import { definition as modifierDefinition, createPostProcess } from './objectmod';
import {
  Environment,
  ComparatorString,
  ComparatorValue,
  ComparatorLogic,
  ObjectModifier,
  CharacterState,
  CSListenerRecord,
  Ruleset,
  Attribute,
} from './types';
import { DerivedValueType, CharacteristicType } from './enums';
import * as enums from './enums';
import { insertObject, performAction } from './character';
import { definition as attrDefinition } from './attribute';

const demoRuleset: Ruleset = {
  characteristics: {
    [enums.CharacteristicType.ATTRIBUTES]: attrDefinition,
    [enums.CharacteristicType.OBJECT_MODIFIERS]: modifierDefinition,
  }
}

const demoCharState: CharacterState = {
  character: fixtures.character({
    characteristics: {
      attributes: {
        Dexterity: fixtures.attribute({
          name: 'Dexterity',
          abbreviation: 'DX',
          lvl: 14,
          base: 14,
        }),
        Health: fixtures.attribute({
          name: 'Health',
          abbreviation: 'HT',
          lvl: 18,
          base: 18,
        }),
        Basic_Speed: fixtures.attribute({
          name: 'Basic Speed',
          abbreviation: 'BS',
          lvl: 16,
          base: {
            type: DerivedValueType.BRACKET,
            values: [
              2,
              {
                type: DerivedValueType.CHARACTERISTIC,
                charType: CharacteristicType.ATTRIBUTES,
                property: 'lvl',
                key: 'Dexterity',
                fallback: 10,
              },
            ],
            operands: ['+'],
          },
        }),
      },
      objectMods: {},
    }
  }),
  registry: [
    {
      listeningCharKey: 'Basic_Speed',
      listeningCharType: enums.CharacteristicType.ATTRIBUTES,
      origin: 'Dexterity',
      funcID: 'updateLevel',
      eventName: enums.CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
    },
  ],
};

const testEnvironmentWithResult = ({
  bool,
  number,
  text,
  select,
}: {
  bool?;
  number?;
  text?;
  select?;
}): Environment => ({
  logger: {
    debug: (x) => null,
    log: (x) => null,
    warn: (x) => null,
    error: (x) => null,
    fatal: (x) => null,
  },
  prompter: {
    bool: (ctx) => bool,
    number: (ctx) => number,
    text: (ctx) => text,
    select: (ctx, opts, def) => select,
  },
});

const checkModifierApplied = (
  om: ObjectModifier,
  omKey: string,
  state: CharacterState,
  yesKeys: string[],
  noKeys: string[],
) => {
  const exists = (key: string) => (
    state.character.objectModifierRegister[om.selector.charType]?.[key]?.[
      om.effect.targetProp
    ] || []
  ).findIndex((k) => k === omKey) !== -1;
  yesKeys.forEach((x) => expect(exists(x)).toStrictEqual(true));
  noKeys.forEach((x) => expect(exists(x)).toStrictEqual(false));
};

const getEventListeners = (
  origin: string,
  eventName: string,
  registry: CSListenerRecord[],
) => {
  const listeners = registry.filter(
    (x) => x.eventName === eventName && x.origin === origin,
  );
  return listeners.map((x) => ({
    type: x.listeningCharType,
    key: x.listeningCharKey,
    func: x.funcID,
  }));
};

describe('When creating and inserting a modifier,', () => {
  describe('with no filter,', () => {
    const unfilteredModifier = fixtures.objectMod({
      selector: {
        charType: enums.CharacteristicType.ATTRIBUTES,
        filter: { type: 'auto', result: true },
      },
    });
    const insertResult = insertObject(unfilteredModifier,enums.CharacteristicType.OBJECT_MODIFIERS,{ keyOverride: 'test' })((demoCharState),demoRuleset,fixtures.environment({}))
    it('returns Modifier Created event,', () => expect(insertResult.events).toContainEqual({
      name: enums.CSEventNames.MODIFIER_CREATED,
      origin: 'test',
    }));
    it('returns Modifier Subject Changed event,', () => expect(insertResult.events).toContainEqual({
      name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
      origin: 'test',
    }));
    it('creates entries in modifier register for Dexterity and Health', () => {
      expect(() => checkModifierApplied(
        unfilteredModifier,
        'test',
        insertResult.state,
        ['Dexterity', 'Health', 'Basic_Speed'],
        [],
      )).not.toThrow();
    });
    it('subject listeners are made and ready to react to event', () => {
      const listeners = getEventListeners(
        'test',
        enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        insertResult.state.registry,
      );
      expect(listeners).toHaveLength(3);
      expect(listeners).toContainEqual({
        key: 'Dexterity',
        type: enums.CharacteristicType.ATTRIBUTES,
        func: 'updateLevel',
      });
    });
    const propogated = performAction(insertObject(unfilteredModifier,enums.CharacteristicType.OBJECT_MODIFIERS,{ keyOverride: 'test' }),demoCharState,demoRuleset,fixtures.environment({}))
    it('after propogation, subject levels are increased by 1', () => {
      expect(
        (propogated.character.characteristics[enums.CharacteristicType.ATTRIBUTES].Dexterity as Attribute).lvl,
      ).toMatchObject({ base: 14, modded: 15 });
      expect(
        (propogated.character.characteristics[enums.CharacteristicType.ATTRIBUTES].Health as Attribute).lvl,
      ).toMatchObject({ base: 18, modded: 19 });
      expect(
        (propogated.character.characteristics[enums.CharacteristicType.ATTRIBUTES].Basic_Speed as Attribute).lvl,
      ).toMatchObject({ base: 17, modded: 18 });
    });
  });
  describe('with a limited key filter,', () => {
    const limitedModifier = fixtures.objectMod({
      selector: {
        limitKeys: ['Dexterity'],
        charType: enums.CharacteristicType.ATTRIBUTES,
        filter: { type: 'auto', result: true },
      },
    });
    const insertResult = insertObject(limitedModifier,enums.CharacteristicType.OBJECT_MODIFIERS,{ keyOverride: 'test' })(demoCharState,demoRuleset,fixtures.environment({}))
    it('returns Modifier Created event,', () => expect(insertResult.events).toContainEqual({
      name: enums.CSEventNames.MODIFIER_CREATED,
      origin: 'test',
    }));
    it('returns Modifier Subject Changed event,', () => expect(insertResult.events).toContainEqual({
      name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
      origin: 'test',
    }));
    it('only creates entries in modifier register for selected key', () => {
      expect(() => checkModifierApplied(
        limitedModifier,
        'test',
        insertResult.state,
        ['Dexterity'],
        ['Health', 'Basic_Speed'],
      )).not.toThrow();
    });
    it('subject listeners are made and ready to react to event', () => {
      const listeners = getEventListeners(
        'test',
        enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        insertResult.state.registry,
      );
      expect(listeners).toHaveLength(1);
      expect(listeners).toContainEqual({
        key: 'Dexterity',
        type: enums.CharacteristicType.ATTRIBUTES,
        func: 'updateLevel',
      });
    });
    const propogated = performAction(insertObject(limitedModifier,enums.CharacteristicType.OBJECT_MODIFIERS,{ keyOverride: 'test' }),demoCharState,demoRuleset,fixtures.environment({}))
    it('after propogation, subject levels are increased by 1', () => {
      expect(
        (propogated.character.characteristics[enums.CharacteristicType.ATTRIBUTES].Dexterity as Attribute).lvl,
      ).toMatchObject({ base: 14, modded: 15 });
      expect(
        (propogated.character.characteristics[enums.CharacteristicType.ATTRIBUTES].Basic_Speed as Attribute)
          .lvl,
      ).toStrictEqual(17);
    });
  });
  describe('with a simple derived value comparator filter,', () => {
    const valueFilteredModifier = fixtures.objectMod({
      selector: {
        charType: enums.CharacteristicType.ATTRIBUTES,
        filter: {
          type: 'value',
          a: 18,
          b: {
            type: enums.DerivedValueType.CHARACTERISTIC,
            charType: enums.CharacteristicType.ATTRIBUTES,
            key: '__subject',
            property: 'lvl',
            fallback: -100,
          },
          comparator: '=',
        },
      },
    });
    const insertResult = insertObject(valueFilteredModifier,enums.CharacteristicType.OBJECT_MODIFIERS,{ keyOverride: 'test' })(demoCharState,demoRuleset,fixtures.environment({}))
    it('returns Modifier Created event,', () => expect(insertResult.events).toContainEqual({
      name: enums.CSEventNames.MODIFIER_CREATED,
      origin: 'test',
    }));
    it('returns Modifier Subject Changed event,', () => expect(insertResult.events).toContainEqual({
      name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
      origin: 'test',
    }));
    it('only creates entries in modifier register for objects matching criteria', () => {
      expect(() => checkModifierApplied(
        valueFilteredModifier,
        'test',
        insertResult.state,
        ['Health'],
        ['Dexterity', 'Basic_Speed'],
      )).not.toThrow();
    });
    it('subject listeners are made and ready to react to event', () => {
      const listeners = getEventListeners(
        'test',
        enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        insertResult.state.registry,
      );
      expect(listeners).toHaveLength(1);
      expect(listeners).toContainEqual({
        key: 'Health',
        type: enums.CharacteristicType.ATTRIBUTES,
        func: 'updateLevel',
      });
    });
    const propogated = performAction(insertObject(valueFilteredModifier,enums.CharacteristicType.OBJECT_MODIFIERS,{ keyOverride: 'test' }),demoCharState,demoRuleset,fixtures.environment({}))
    it('after propogation, subject levels are increased by 1', () => {
      expect(
        (propogated.character.characteristics[enums.CharacteristicType.ATTRIBUTES].Health as Attribute).lvl,
      ).toMatchObject({ base: 18, modded: 19 });
    });
  });
  describe('with a complex logical criteria filter,', () => {
    // TRUE if Name === Dexterity OR Level / 4 === 8 (for Speed)
    const nameFilter: ComparatorString = {
      type: 'string',
      a: 'Dexterity',
      b: {
        type: enums.DerivedStringType.CHARACTERISTIC,
        charType: enums.CharacteristicType.ATTRIBUTES,
        key: '__subject',
        property: 'name',
        fallback: '----',
      },
      comparator: 'is',
    };
    const valueFilter: ComparatorValue = {
      type: 'value',
      a: 8,
      b: {
        type: enums.DerivedValueType.BRACKET,
        values: [
          {
            type: enums.DerivedValueType.CHARACTERISTIC,
            charType: enums.CharacteristicType.ATTRIBUTES,
            key: '__subject',
            property: 'lvl',
            fallback: -100,
          },
          8,
        ],
        operands: ['-'],
      },
      comparator: '=',
    };
    const comparator: ComparatorLogic = {
      type: 'logic',
      selectors: [nameFilter, valueFilter],
      operator: 'OR',
    };
    const valueFilteredModifier = fixtures.objectMod({
      selector: {
        charType: enums.CharacteristicType.ATTRIBUTES,
        filter: comparator,
      },
    });
    const insertResult = insertObject(valueFilteredModifier,enums.CharacteristicType.OBJECT_MODIFIERS,{ keyOverride: 'test' })(demoCharState,demoRuleset,fixtures.environment({}))
    it('returns Modifier Created event,', () => expect(insertResult.events).toContainEqual({
      name: enums.CSEventNames.MODIFIER_CREATED,
      origin: 'test',
    }));
    it('returns Modifier Subject Changed event,', () => expect(insertResult.events).toContainEqual({
      name: enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
      origin: 'test',
    }));
    it('only creates entries in modifier register for objects matching criteria', () => {
      expect(() => checkModifierApplied(
        valueFilteredModifier,
        'test',
        insertResult.state,
        ['Dexterity', 'Basic_Speed'],
        ['Health'],
      )).not.toThrow();
    });
    it('subject listeners are made and ready to react to event', () => {
      const listeners = getEventListeners(
        'test',
        enums.CSEventNames.MODIFIER_SUBJECTS_CHANGED,
        insertResult.state.registry,
      );
      expect(listeners).toHaveLength(2);
      expect(listeners).toContainEqual({
        key: 'Basic_Speed',
        type: enums.CharacteristicType.ATTRIBUTES,
        func: 'updateLevel',
      });
    });
    const propogated = performAction(insertObject(valueFilteredModifier,enums.CharacteristicType.OBJECT_MODIFIERS,{ keyOverride: 'test' }),demoCharState,demoRuleset,fixtures.environment({}))
    it('after propogation, subject levels are increased by 1', () => {
      expect(
        (propogated.character.characteristics[enums.CharacteristicType.ATTRIBUTES].Dexterity as Attribute).lvl,
      ).toMatchObject({ base: 14, modded: 15 });
      expect(
        (propogated.character.characteristics[enums.CharacteristicType.ATTRIBUTES].Basic_Speed as Attribute).lvl,
      ).toMatchObject({ base: 17, modded: 18 });
    });
  });
});
