import { describe, expect, test, it } from '@jest/globals';
import { text } from 'express';
import { calcDerivedValue, costMapLevelToPoints, costMapPointsToLevel, testComparator } from './utility';
import * as fixtures from './fixtures';
import { ComparatorAutomatic, ComparatorLogic, ComparatorString, ComparatorValue, DerivedValue, DerivedValueResult } from './types';
import * as enums from './enums';

const demoCharState = {
  character: fixtures.character({
    attributes: {
      Dexterity: fixtures.attribute({ name: 'Dexterity', abbreviation: 'DX', lvl: 14 }),
      Health: fixtures.attribute({ name: 'Health', abbreviation: 'HT', lvl: 18 }),
    },
  }),
  registry: [],
};

describe('CalculateBase', () => {
  describe('Given a non-\'Base\' type', () => {
    it('with the numeral 10, returns text 10 and value 10', () => {
      const base: DerivedValue = 10;
      const res = calcDerivedValue(base, demoCharState);
      expect(res).toHaveProperty('text', '10');
      expect(res).toHaveProperty('value', 10);
    });
    test.failing('With undefined, errors and fails', () => {
      const base: DerivedValue = undefined;
      calcDerivedValue(base, demoCharState);
    });
    test.failing('With null, errors and fails', () => {
      const base: DerivedValue = null;
      calcDerivedValue(base, demoCharState);
    });
    test.failing('With a string, errors and fails', () => {
      const base: DerivedValue = '10' as any;
      calcDerivedValue(base, demoCharState);
    });
  });
  describe('Given a Bracketed Base', () => {
    it('with 10 x 5, returns text ( 10 x 5 ) and value 50', () => {
      const base: DerivedValue = {
        type: enums.DerivedValueType.BRACKET,
        values: [10, 5],
        operands: ['x'],
      };
      const res = calcDerivedValue(base, demoCharState);
      expect(res).toHaveProperty('text', '( 10 x 5 )');
      expect(res).toHaveProperty('value', 50);
    });
    it('with 10 - 5 x 2, returns value 0, proving correct operand order', () => {
      const base: DerivedValue = {
        type: enums.DerivedValueType.BRACKET,
        values: [10, 5, 2],
        operands: ['-', 'x'],
      };
      const res = calcDerivedValue(base, demoCharState);
      expect(res).toHaveProperty('text', '( 10 - 5 x 2 )');
      expect(res).toHaveProperty('value', 0);
    });
    test.failing('With three values and only 1 operand; errors and fails', () => {
      const base: DerivedValue = {
        type: enums.DerivedValueType.BRACKET,
        values: [10, 5, 2],
        operands: ['-'],
      };
      calcDerivedValue(base, demoCharState);
    });
    test.failing('With two values and two operands; errors and fails', () => {
      const base: DerivedValue = {
        type: enums.DerivedValueType.BRACKET,
        values: [10, 5],
        operands: ['-', '+'],
      };
      calcDerivedValue(base, demoCharState);
    });
  });
  describe('Given an Attribute Base', () => {
    it('with attribute equalling 14, returns 14', () => {
      const base: DerivedValue = {
        type: enums.DerivedValueType.CHARACTERISTIC,
        charType: enums.CharacteristicType.ATTRIBUTES,
        property: 'lvl',
        key: 'Dexterity',
        fallback: 10,
      };
      const res = calcDerivedValue(base, demoCharState);
      expect(res).toHaveProperty('text', 'DX');
      expect(res).toHaveProperty('value', 14);
      expect(res.updateTriggers).toHaveLength(2);
    });
    it('with attribute not existing and fallback value of 10, returns 10', () => {
      const base: DerivedValue = {
        type: enums.DerivedValueType.CHARACTERISTIC,
        charType: enums.CharacteristicType.ATTRIBUTES,
        property: 'lvl',
        key: 'Strength',
        fallback: 10,
      };
      const res = calcDerivedValue(base, demoCharState);
      expect(res).toHaveProperty('text', '10');
      expect(res).toHaveProperty('value', 10);
      expect(res.updateTriggers).toHaveLength(1);
    });
  });
  describe('Given a complex base', () => {
    it('with an attempt to resolve (DX + HT)/4, when DX = 14 and HT = 18, returns text ( DX + HT ) / 4 and value 8', () => {
      const base: DerivedValue = {
        type: enums.DerivedValueType.BRACKET,
        values: [
          {
            type: enums.DerivedValueType.BRACKET,
            values: [
              {
                type: enums.DerivedValueType.CHARACTERISTIC,
                charType: enums.CharacteristicType.ATTRIBUTES,
                property: 'lvl',
                key: 'Dexterity',
                fallback: 10,
              },
              {
                type: enums.DerivedValueType.CHARACTERISTIC,
                charType: enums.CharacteristicType.ATTRIBUTES,
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
      };
      const expectedState: DerivedValueResult = {
        updateTriggers: [
          {
            eventName: enums.CSEventNames.ATTRIBUTE_DELETED,
            origin: 'attributes.Dexterity',
          },
          {
            eventName: enums.CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
            origin: 'attributes.Dexterity',
          },
          {
            eventName: enums.CSEventNames.ATTRIBUTE_DELETED,
            origin: 'attributes.Health',
          },
          {
            eventName: enums.CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
            origin: 'attributes.Health',
          },
        ],
        text: '( ( DX + HT ) / 4 )',
        value: 8,
      };
      expect(calcDerivedValue(base, demoCharState)).toStrictEqual(expectedState);
    });
  });
});

describe('Cost Table Calculations', () => {
  describe('Determining points for a given level', () => {
    it('with an item with no properties, returns 0', () => {
      expect(costMapLevelToPoints({}, 0)).toStrictEqual(0);
    });
    it('with an item with only flat, returns that flat', () => {
      expect(costMapLevelToPoints({ flat: 25 }, 0)).toStrictEqual(25);
    });
    it('with an item with per level costs, returns correct values.', () => {
      expect(costMapLevelToPoints({ perLvl: 25 }, 5)).toStrictEqual(125);
      expect(costMapLevelToPoints({ perLvl: 25 }, -5)).toStrictEqual(-125);
    });
    it('with an item with progression costs, it returns correct values', () => {
      expect(costMapLevelToPoints({ progression: [5, 25, 50] }, 0)).toStrictEqual(0);
      expect(costMapLevelToPoints({ progression: [5, 25, 50] }, 1)).toStrictEqual(5);
      expect(costMapLevelToPoints({ progression: [5, 25, 50] }, 2)).toStrictEqual(25);
      expect(costMapLevelToPoints({ progression: [5, 25, 50] }, 3)).toStrictEqual(50);
      expect(costMapLevelToPoints({ progression: [5, 25, 50] }, 4)).toStrictEqual(50);
    });
    it('with an item with a base cost and a per level cost, returns base + bought levels', () => {
      expect(costMapLevelToPoints({ flat: 25, perLvl: 25 }, 2)).toStrictEqual(75);
      expect(costMapLevelToPoints({ flat: 25, perLvl: 25 }, 2)).toStrictEqual(75);
    });
    it('with an item with a base cost and a progressive cost, returns base + bought levels', () => {
      expect(costMapLevelToPoints({ flat: 25, progression: [5, 25, 50] }, 2)).toStrictEqual(50);
    });
    it('with an item with a combined progression and per-levels, it first uses progression levels, then per-levels.', () => {
      expect(costMapLevelToPoints({ perLvl: 9, progression: [5, 25, 50] }, 3)).toStrictEqual(50);
      expect(costMapLevelToPoints({ perLvl: 9, progression: [5, 25, 50] }, 4)).toStrictEqual(59);
      expect(costMapLevelToPoints({ perLvl: 9, progression: [5, 25, 50] }, 5)).toStrictEqual(68);
      expect(costMapLevelToPoints({ perLvl: 9, progression: [5, 25, 50] }, 0)).toStrictEqual(0);
    });
  });
  describe('Determining level from a given points', () => {
    it('with an item with no properties, returns 0', () => {
      expect(costMapPointsToLevel({}, 0)).toStrictEqual(0);
    });
    it('with an item with only a flat cost, returns 0', () => {
      // TODO: Consider if this reflects a problem or not. I don't think so. Will probably have a check elsewhere for 'does X have enough points *for* that level'.
      expect(costMapPointsToLevel({ flat: 25 }, 0)).toStrictEqual(0);
      expect(costMapPointsToLevel({ flat: 25 }, 25)).toStrictEqual(0);
      expect(costMapPointsToLevel({ flat: 25 }, 50)).toStrictEqual(0);
    });
    it('with an item with only per-level costs, correctly determines level from points', () => {
      expect(costMapPointsToLevel({ perLvl: 5 }, 0)).toStrictEqual(0);
      expect(costMapPointsToLevel({ perLvl: 5 }, 3)).toStrictEqual(0);
      expect(costMapPointsToLevel({ perLvl: 5 }, 5)).toStrictEqual(1);
      expect(costMapPointsToLevel({ perLvl: 5 }, 7)).toStrictEqual(1);
      expect(costMapPointsToLevel({ perLvl: 5 }, 10)).toStrictEqual(2);
      expect(Math.abs(costMapPointsToLevel({ perLvl: -5 }, 0))).toStrictEqual(0);
      expect(costMapPointsToLevel({ perLvl: -5 }, -3)).toStrictEqual(0);
      expect(costMapPointsToLevel({ perLvl: -5 }, -5)).toStrictEqual(1);
      expect(costMapPointsToLevel({ perLvl: -5 }, -7)).toStrictEqual(1);
      expect(costMapPointsToLevel({ perLvl: -5 }, -10)).toStrictEqual(2);
      expect(Math.abs(costMapPointsToLevel({ perLvl: 5 }, 0))).toStrictEqual(0);
      expect(Math.abs(costMapPointsToLevel({ perLvl: 5 }, -3))).toStrictEqual(0);
      expect(costMapPointsToLevel({ perLvl: 5 }, -5)).toStrictEqual(-1);
      expect(costMapPointsToLevel({ perLvl: 5 }, -7)).toStrictEqual(-1);
      expect(costMapPointsToLevel({ perLvl: 5 }, -10)).toStrictEqual(-2);
    });
    it('with an item with only progressive costs, correctly determines level from points', () => {
      expect(costMapPointsToLevel({ progression: [5, 25, 75] }, 3)).toStrictEqual(0);
      expect(costMapPointsToLevel({ progression: [5, 25, 75] }, 5)).toStrictEqual(1);
      expect(costMapPointsToLevel({ progression: [5, 25, 75] }, 30)).toStrictEqual(2);
      expect(costMapPointsToLevel({ progression: [5, 25, 75] }, 200)).toStrictEqual(3);
    });
    it('with an item with only progressive and levelled costs, correctly determines level from points', () => {
      expect(costMapPointsToLevel({ progression: [5, 25, 75], perLvl: 9 }, 3)).toStrictEqual(0);
      expect(costMapPointsToLevel({ progression: [5, 25, 75], perLvl: 9 }, 5)).toStrictEqual(1);
      expect(costMapPointsToLevel({ progression: [5, 25, 75], perLvl: 9 }, 35)).toStrictEqual(2);
      expect(costMapPointsToLevel({ progression: [5, 25, 75], perLvl: 9 }, 95)).toStrictEqual(5);
      expect(costMapPointsToLevel({ progression: [-5, -25, -75], perLvl: -9 }, -3)).toStrictEqual(0);
      expect(costMapPointsToLevel({ progression: [-5, -25, -75], perLvl: -9 }, -5)).toStrictEqual(1);
      expect(costMapPointsToLevel({ progression: [-5, -25, -75], perLvl: -9 }, -35)).toStrictEqual(2);
      expect(costMapPointsToLevel({ progression: [-5, -25, -75], perLvl: -9 }, -95)).toStrictEqual(5);
    });
    it('with an item with flat / custom and progression / levelled costs, determines level from points', () => {
      expect(costMapPointsToLevel({ flat: 5, progression: [5, 25, 75], perLvl: 9 }, 3)).toStrictEqual(0);
      expect(costMapPointsToLevel({ flat: 5, progression: [5, 25, 75], perLvl: 9 }, 5)).toStrictEqual(0);
      expect(costMapPointsToLevel({ flat: 5, progression: [5, 25, 75], perLvl: 9 }, 10)).toStrictEqual(1);
      expect(costMapPointsToLevel({ flat: 5, progression: [5, 25, 75], perLvl: 9 }, 80)).toStrictEqual(3);
      expect(costMapPointsToLevel({ flat: 5, progression: [5, 25, 75], perLvl: 9 }, 89)).toStrictEqual(4);
      expect(costMapPointsToLevel({ flat: -5, progression: [-5, -25, -75], perLvl: -9 }, -89)).toStrictEqual(4);
    });
  });
});

describe('Object Filtering', () => {
  describe('When using the LogicalOperator test', () => {
    it('with the OR Operator, returns true when any option is true', () => {
      const passA: ComparatorLogic = {
        type: 'logic',
        operator: 'OR',
        selectors: [
          { type: 'auto', result: false },
          { type: 'auto', result: true },
          { type: 'auto', result: false },
        ],
      };
      const passB: ComparatorLogic = {
        type: 'logic',
        operator: 'OR',
        selectors: [
          { type: 'auto', result: true },
          { type: 'auto', result: true },
          { type: 'auto', result: true },
        ],
      };
      const fail: ComparatorLogic = {
        type: 'logic',
        operator: 'OR',
        selectors: [
          { type: 'auto', result: false },
          { type: 'auto', result: false },
          { type: 'auto', result: false },
        ],
      };
      expect(testComparator(passA, demoCharState)).toStrictEqual(true);
      expect(testComparator(passB, demoCharState)).toStrictEqual(true);
      expect(testComparator(fail, demoCharState)).toStrictEqual(false);
    });
    it('with the NOR Operator, returns all options are false', () => {
      const passA: ComparatorLogic = {
        type: 'logic',
        operator: 'NOR',
        selectors: [
          { type: 'auto', result: false },
          { type: 'auto', result: false },
          { type: 'auto', result: false },
        ],
      };
      const passB: ComparatorLogic = {
        type: 'logic',
        operator: 'NOR',
        selectors: [
          { type: 'auto', result: false },
        ],
      };
      const failA: ComparatorLogic = {
        type: 'logic',
        operator: 'NOR',
        selectors: [
          { type: 'auto', result: true },
          { type: 'auto', result: true },
          { type: 'auto', result: true },
        ],
      };
      const failB: ComparatorLogic = {
        type: 'logic',
        operator: 'NOR',
        selectors: [
          { type: 'auto', result: false },
          { type: 'auto', result: true },
          { type: 'auto', result: false },
        ],
      };
      expect(testComparator(passA, demoCharState)).toStrictEqual(true);
      expect(testComparator(passB, demoCharState)).toStrictEqual(true);
      expect(testComparator(failA, demoCharState)).toStrictEqual(false);
      expect(testComparator(failB, demoCharState)).toStrictEqual(false);
    });
    it('with the AND Operator, returns all options are true', () => {
      const passA: ComparatorLogic = {
        type: 'logic',
        operator: 'AND',
        selectors: [
          { type: 'auto', result: true },
          { type: 'auto', result: true },
          { type: 'auto', result: true },
        ],
      };
      const passB: ComparatorLogic = {
        type: 'logic',
        operator: 'AND',
        selectors: [
          { type: 'auto', result: true },
        ],
      };
      const failA: ComparatorLogic = {
        type: 'logic',
        operator: 'AND',
        selectors: [
          { type: 'auto', result: true },
          { type: 'auto', result: false },
          { type: 'auto', result: true },
        ],
      };
      const failB: ComparatorLogic = {
        type: 'logic',
        operator: 'AND',
        selectors: [
          { type: 'auto', result: false },
          { type: 'auto', result: false },
          { type: 'auto', result: false },
        ],
      };
      expect(testComparator(passA, demoCharState)).toStrictEqual(true);
      expect(testComparator(passB, demoCharState)).toStrictEqual(true);
      expect(testComparator(failA, demoCharState)).toStrictEqual(false);
      expect(testComparator(failB, demoCharState)).toStrictEqual(false);
    });
  });
  describe('When using the LogicalString test', () => {
    it('with the is comparator, only matches if strings match', () => {
      expect(testComparator({
        type: 'string',
        a: 'a',
        b: 'a',
        comparator: 'is',
      }, demoCharState)).toStrictEqual(true);
      expect(testComparator({
        type: 'string',
        a: 'a',
        b: 'b',
        comparator: 'is',
      }, demoCharState)).toStrictEqual(false);
    });
    it('with the includes comparator, matches if strings contain eachother', () => {
      expect(testComparator({
        type: 'string',
        a: 'somestring',
        b: 'string',
        comparator: 'includes',
      }, demoCharState)).toStrictEqual(true);
      expect(testComparator({
        type: 'string',
        a: 'somestring',
        b: 'other',
        comparator: 'includes',
      }, demoCharState)).toStrictEqual(false);
    });
    it('with the regex comparator, returns true if regex matches', () => {
      expect(testComparator({
        type: 'string',
        a: 'Something1234',
        b: '[A-Za-z]{8,20}\\d{4}',
        comparator: 'regex',
      }, demoCharState)).toStrictEqual(true);
      expect(testComparator({
        type: 'string',
        a: 'Something1234',
        b: '[A-Za-z]{4}\\d{10}',
        comparator: 'regex',
      }, demoCharState)).toStrictEqual(false);
    });
  });
  describe('When using the LogicalValue test', () => {
    it('with the = comparator, return true if values are identical', () => {
      expect(testComparator({
        type: 'value',
        a: 5,
        b: 5,
        comparator: '=',
      }, demoCharState)).toStrictEqual(true);
      expect(testComparator({
        type: 'value',
        a: 5,
        b: 6,
        comparator: '=',
      }, demoCharState)).toStrictEqual(false);
    });
    it('with the > comparator, return true if value a is greater than b', () => {
      expect(testComparator({
        type: 'value',
        a: 6,
        b: 5,
        comparator: '>',
      }, demoCharState)).toStrictEqual(true);
      expect(testComparator({
        type: 'value',
        a: 5,
        b: 5,
        comparator: '>',
      }, demoCharState)).toStrictEqual(false);
    });
    it('with the < comparator, return true if value a is less than b', () => {
      expect(testComparator({
        type: 'value',
        a: 5,
        b: 6,
        comparator: '<',
      }, demoCharState)).toStrictEqual(true);
      expect(testComparator({
        type: 'value',
        a: 5,
        b: 5,
        comparator: '<',
      }, demoCharState)).toStrictEqual(false);
    });
    it('with the != comparator, return true if values are different', () => {
      expect(testComparator({
        type: 'value',
        a: 5,
        b: 6,
        comparator: '!=',
      }, demoCharState)).toStrictEqual(true);
      expect(testComparator({
        type: 'value',
        a: 5,
        b: 5,
        comparator: '!=',
      }, demoCharState)).toStrictEqual(false);
    });
  });
  describe('When using TestComparator on a single object', () => {
    it('with a Auto type; the test returns the designated result', () => {
      const comparator: ComparatorAutomatic = { type: 'auto', result: true };
      expect(testComparator(comparator, demoCharState)).toStrictEqual(true);
    });
    it('with a String type checking the subject\'s name, the test only passes when name matches', () => {
      const comparator: ComparatorString = {
        type: 'string',
        a: 'Dexterity',
        b: {
          type: enums.DerivedStringType.CHARACTERISTIC,
          fallback: '--',
          charType: enums.CharacteristicType.ATTRIBUTES,
          key: '__subject',
          property: 'name',
        },
        comparator: 'is',
      };
      expect(testComparator(comparator, demoCharState, { subject: demoCharState.character.attributes.Dexterity })).toStrictEqual(true);
      expect(testComparator(comparator, demoCharState, { subject: demoCharState.character.attributes.Strength })).toStrictEqual(false);
    });
    it('with a Value type checking the subject\'s level, the test only passes when the level matches', () => {
      const comparator: ComparatorValue = {
        type: 'value',
        a: 14,
        b: {
          type: enums.DerivedValueType.CHARACTERISTIC,
          fallback: 0,
          charType: enums.CharacteristicType.ATTRIBUTES,
          key: '__subject',
          property: 'lvl',
        },
        comparator: '=',
      };
      expect(testComparator(comparator, demoCharState, { subject: demoCharState.character.attributes.Dexterity })).toStrictEqual(true);
      expect(testComparator(comparator, demoCharState, { subject: demoCharState.character.attributes.Strength })).toStrictEqual(false);
    });
  });
});
