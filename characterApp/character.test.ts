import { describe, expect, it, test } from '@jest/globals';
import _ from 'lodash/fp';
import { insertObject, performAction } from './character';
import { definition as attrDefinition } from './attribute'
import * as fixtures from './fixtures';
import type { CSAction, CSEvent, CharacterState, Characteristic, CharacteristicDefinition, Environment, EventActionMap } from './types';
import * as enums from './enums';

const emptyAction:CSAction = (e,c) => ( {state:c, events: [] })
const emptyActionWithEvent = (ename:enums.CSEventNames,origin?:string):CSAction => (e,c) => ( {state: c, events: [{name:ename,origin}] })

const demoCharState:CharacterState = {
  character: fixtures.character({
    testing:{},
  }),
  registry: [],
};

const testEnvironmentWithResult = ({ bool, number, text, select }: { bool?, number?, text?, select?}): Environment => 
  {
    const newEnv:Environment = {
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
    ruleset: {
      characteristics: {
        [enums.CharacteristicType.TESTING]: {
            key: enums.CharacteristicType.TESTING,
            functions: {
              create: function (key: string, obj: Characteristic): CSAction {
                return emptyActionWithEvent(enums.CSEventNames.ATTRIBUTE_CREATED,exampleKey)
              },
              delete: function (key: string, obj: Characteristic): CSAction {
                return emptyAction
              },
              generateKey: function (o: Characteristic): string {
                return 'exampleKey'
              }
            },
            createEvent: enums.CSEventNames.ATTRIBUTE_CREATED,
            deleteEvent: enums.CSEventNames.ATTRIBUTE_CREATED,
            moddableValues: {},
            selectableValues: {}
        },
      }
    }
  }
  return newEnv
}
;

const exampleKey = 'exampleKey'

describe('Object Insertion', () => {
  describe('Given an Object Insertion request', () => {
    const obj: Characteristic = { name: 'ExampleObj', description: '', tags: [] }
    const res = insertObject(obj,enums.CharacteristicType.TESTING,{})(testEnvironmentWithResult({}),demoCharState)
    it('Returns a state with the object inserted', () => {
      expect(res.state.character[enums.CharacteristicType.TESTING][exampleKey] == obj)
    })
    it('Returns the appropriate Create Event', () => {
      expect(res.events).toHaveLength(1)
      expect(res.events).toContainEqual({ name: enums.CSEventNames.ATTRIBUTE_CREATED, origin: exampleKey } as CSEvent)
    })
  })
})

describe('Action Performance', () => {
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
    it.skip('that returns events that propogate, it should run successfully', () => {
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
})
