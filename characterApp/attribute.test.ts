import { it, expect, test, describe } from '@jest/globals';
import _ from 'lodash/fp';
import * as fixtures from './fixtures';
import { attributeEventsHandler, insert, updateLevel } from './attribute';
import { Environment, Attribute } from './types';
import { DerivedValueType, CharacteristicType } from './enums';
import { performAction } from './character';

const demoCharState = {
  character: fixtures.character({
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
  ruleset: {},
});

describe('Character Functions', () => {
  // TODO: REWRITE INSERT TESTS.
  // describe('Given an InsertAttribute request', () => {
  //   it('with a new attribute, it is added', () => {
  //     const newState = insert(
  //       fixtures.attribute({ name: 'Strength', abbreviation: 'ST', lvl: 10 }),
  //       {},
  //     )(testEnvironmentWithResult({}), { ...demoCharState });
  //     expect(newState.state.character).toHaveProperty('attributes.Strength');
  //   });
  //   test.failing(
  //     'With an existing attribute and no handling method, then it errors',
  //     () => {
  //       insert(fixtures.attribute({ name: 'Dexterity' }), {})(
  //         testEnvironmentWithResult({}),
  //         { ...demoCharState },
  //       );
  //     },
  //   );
  //   it('with an existing attribute and the overwrite command, then it is replaced', () => {
  //     const newState = insert(
  //       fixtures.attribute({ name: 'Dexterity', abbreviation: 'DX', lvl: 10 }),
  //       { conflictMethod: 'overwrite' },
  //     )(testEnvironmentWithResult({}), { ...demoCharState });
  //     expect(newState.state.character).toHaveProperty(
  //       'attributes.Dexterity.lvl',
  //       10,
  //     );
  //   });
  //   it('with an existing attribute and the ignore command, then the original is maintained', () => {
  //     const newState = insert(
  //       fixtures.attribute({ name: 'Dexterity', abbreviation: 'DX', lvl: 10 }),
  //       { conflictMethod: 'ignore' },
  //     )(testEnvironmentWithResult({}), { ...demoCharState });
  //     expect(newState.state.character).toHaveProperty(
  //       'attributes.Dexterity.lvl',
  //       14,
  //     );
  //   });
  //   it('with an existing attribute and the prompt command, then then it respects the prompted response (overwrite)', () => {
  //     const newState = insert(
  //       fixtures.attribute({ name: 'Dexterity', abbreviation: 'DX', lvl: 10 }),
  //       { conflictMethod: 'prompt' },
  //     )(testEnvironmentWithResult({ select: 'overwrite' }), {
  //       ...demoCharState,
  //     });
  //     expect(newState.state.character).toHaveProperty(
  //       'attributes.Dexterity.lvl',
  //       10,
  //     );
  //   });
  // });
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
      const newState = updateLevel('Basic_Speed')(
        testEnvironmentWithResult({}),
        _.set('character.attributes.Basic_Speed', BasicSpeed)(demoCharState),
      );
      expect(newState.state.character.attributes.Basic_Speed.lvl).toBe(8);
      const finalState = performAction(
        testEnvironmentWithResult({}),
        _.set('character.attributes.Dexterity.base')(12)(newState.state),
        updateLevel('Dexterity'),
        { attributes: attributeEventsHandler },
      );
      expect(finalState.character.attributes.Basic_Speed.lvl).toBe(7.5);
    });
  });
});
