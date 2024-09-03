import { it, expect, test, describe } from '@jest/globals';
import _ from 'lodash/fp';
import * as fixtures from './fixtures';
import { definition as AttributeDefinition, updateLevel } from './attribute';
import { Environment, Attribute, Ruleset } from './types';
import { DerivedValueType, CharacteristicType } from './enums';
import { performAction } from './character';


const demoRuleset:Ruleset = {
  characteristics: {
    attributes: AttributeDefinition,
  }
}

const demoCharState = {
  character: fixtures.character({
    characteristics: {
      attributes: {
        Dexterity: fixtures.attribute({
          name: 'Dexterity',
          abbreviation: 'DX',
          lvl: 14,
        }),
        Health: fixtures.attribute({
          name: 'Health',
          abbreviation: 'HT',
          lvl: 18,
        }),
        Basic_Speed: fixtures.attribute({
          name: 'Basic Speed',
          abbreviation: 'BS',
          lvl: 32,
          base: {
            type: DerivedValueType.BRACKET,
            values: [
              {
                type: DerivedValueType.CHARACTERISTIC,
                charType: CharacteristicType.ATTRIBUTES,
                property: 'lvl',
                key: 'Dexterity',
                fallback: 10,
              },
              {
                type: DerivedValueType.CHARACTERISTIC,
                charType: CharacteristicType.ATTRIBUTES,
                property: 'lvl',
                key: 'Health',
                fallback: 10,
              },
            ],
            operands: ['+'],
          },
        }),
      },
    }
  }),
  registry: [],
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

describe('Character Functions', () => {
  // TODO: REWRITE INSERT TESTS.
  // NOTE: HAHAHA DON'T BECAUSE DON'T NEED THEM NOW FUCK YOU.
  describe('Given a recalculate attribute level request', () => {
    it('with an attribute with a base, it correctly updates listeners and event handlers', () => {
      const BasicSpeed: Attribute = fixtures.attribute({
        name: 'Basic Speed',
        abbreviation: 'BS',
        lvl: 5,
        base: {
          type: DerivedValueType.BRACKET,
          values: [
            {
              type: DerivedValueType.BRACKET,
              values: [
                {
                  type: DerivedValueType.CHARACTERISTIC,
                  charType: CharacteristicType.ATTRIBUTES,
                  property: 'lvl',
                  key: 'Dexterity',
                  fallback: 10,
                },
                {
                  type: DerivedValueType.CHARACTERISTIC,
                  charType: CharacteristicType.ATTRIBUTES,
                  property: 'lvl',
                  key: 'Health',
                  fallback: 10,
                },
              ],
              operands: ['+'],
            },
            4,
          ],
          operands: ['/'],
        },
      });
      const newState = performAction(
        updateLevel('Basic_Speed'),
        _.set('character.characteristics.attributes.Basic_Speed', BasicSpeed)(demoCharState),
        demoRuleset,
        testEnvironmentWithResult({}),
      )
      expect((newState.character.characteristics.attributes.Basic_Speed as Attribute).lvl).toBe(8);
      const finalState = performAction(
        updateLevel('Dexterity'),
        _.set('character.characteristics.attributes.Dexterity.base')(12)(newState),
        demoRuleset,
        testEnvironmentWithResult({}),
      );
      expect((finalState.character.characteristics.attributes.Basic_Speed as Attribute).lvl).toBe(7.5);
    });
  });
});
