import { describe, expect, it } from '@jest/globals';
import _ from 'lodash/fp';
import { performAction } from './character';
import * as fixtures from './fixtures';
import type { CSAction, CharacterState, Environment, EventActionMap } from './types';
import * as enums from './enums';

const demoCharState:CharacterState = {
  character: fixtures.character({
    attributes: {
      Dexterity: fixtures.attribute({ name: 'Dexterity', abbreviation: 'DX', lvl: 14 }),
      Health: fixtures.attribute({ name: 'Health', abbreviation: 'HT', lvl: 18 }),
      TestCounter: fixtures.attribute({ name: 'Test Counter', lvl: 0 }),
      TestName: fixtures.attribute({ name: 'Test Name' }),
    },
  }),
  registry: [
    {
      eventName: 'ValueChanged',
      origin: 'attributes.Health',
      listeningCharKey: 'attributes.TestCounter',
      listeningCharType: enums.CharacteristicType.TESTING,
      funcID: 'incValue',
    },
    {
      eventName: 'ValueChanged',
      origin: 'attributes.TestCounter',
      listeningCharKey: 'attributes.TestName',
      listeningCharType: enums.CharacteristicType.TESTING,
      funcID: 'changeName',
    },
    {
      eventName: 'NameChanged',
      listeningCharKey: 'attributes.Dexterity',
      listeningCharType: enums.CharacteristicType.TESTING,
      funcID: 'incValue',
    },
  ],
};

const testEnvironmentWithResult = ({ bool, number, text, select }: { bool?, number?, text?, select?}): Environment => ({
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

describe('Given an action', () => {
  const eventActionMap: EventActionMap = {
    [enums.CharacteristicType.TESTING]: {
      incValue: (e, state, path, data) => {
        // this simply increments the listener's value.
        const currentVal = _.get(`character.${path}.lvl`)(state) || 0;
        return {
          state: _.set(`character.${path}.lvl`)(currentVal + 1)(state),
          events: [
            {
              name: 'ValueChanged',
              origin: path,
              data: { value: currentVal + 1 },
            },
          ],
        };
      },
      changeName: (e, state, path, data) => {
        // this simply changes the listener's name.
        const currentVal = _.get(`character.${path}.name`)(state) || 'EmptyName';
        return {
          state: _.set(`character.${path}.name`)(`${currentVal}-Changed`)(state),
          events: [
            {
              name: 'NameChanged',
              origin: path,
              data: { value: `${currentVal}-Changed` },
            },
          ],
        };
      },
    },
  };
  it('that returns no events, it runs successfully', () => {
    const testAction: CSAction = (e, c) => ({ state: c, events: [] });
    expect(() => performAction(testEnvironmentWithResult({}), demoCharState, testAction, eventActionMap)).not.toThrow();
  });
  it('that returns events that propogate, it should run successfully', () => {
    const testAction: CSAction = (e, c) => ({
      state: c,
      events: [
        {
          name: 'ValueChanged',
          origin: 'attributes.Health',
        },
      ],
    });
    const res = performAction(testEnvironmentWithResult({}), demoCharState, testAction, eventActionMap);
    expect(res.character.attributes.TestCounter.lvl).toStrictEqual(1);
    expect(res.character.attributes.TestName.name).toStrictEqual('Test Name-Changed');
    expect(res.character.attributes.Dexterity.lvl).toStrictEqual(15);
  });
});
