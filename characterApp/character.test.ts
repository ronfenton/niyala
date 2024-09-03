import { describe, expect, it, test } from '@jest/globals';
import _ from 'lodash/fp';
import { insertObject, performAction } from './character';
import { definition as attrDefinition } from './attribute'
import * as fixtures from './fixtures';
import type { CSAction, CSEvent, CharacterState, Characteristic, CharacteristicDefinition, Environment, EventActionMap, Prompter, Ruleset } from './types';
import * as enums from './enums';

const emptyAction:CSAction = (c,r,e) => ( {state:c, events: [] })
const emptyActionWithEvent = (ename:enums.CSEventNames,origin?:string):CSAction => (c,r,e) => ( {state: c, events: [{name:ename,origin}] })

const demoCharState:CharacterState = {
  character: fixtures.character({
    characteristics: {
      [enums.CharacteristicType.TESTING]: {}
    }
  }),
  registry: [],
};

const demoRuleset:Ruleset = {
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
        eventResponses: {
          incValue: (path, data) => (state, rs, env) => {
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
          changeName: (path, data) => (state, rs, env) => {
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
        createEvent: enums.CSEventNames.ATTRIBUTE_CREATED,
        deleteEvent: enums.CSEventNames.ATTRIBUTE_CREATED,
        moddableValues: {},
        queryableValues: {}
    },
  }
}

const forceEnvironmentResult = (prompter:Partial<Prompter>) => { return fixtures.environment({prompter})}

const exampleKey = 'exampleKey'

describe('Object Insertion', () => {
  describe('Given an Object Insertion request', () => {
    const obj: Characteristic = { name: 'ExampleObj', description: '', tags: [] }
    const res = insertObject(obj,enums.CharacteristicType.TESTING,{})(demoCharState, demoRuleset, fixtures.environment({}))
    it('Returns a state with the object inserted', () => {
      expect(res.state.character.characteristics[enums.CharacteristicType.TESTING][exampleKey] == obj)
    })
    it('Returns the appropriate Create Event', () => {
      expect(res.events).toHaveLength(1)
      expect(res.events).toContainEqual({ name: enums.CSEventNames.ATTRIBUTE_CREATED, origin: exampleKey } as CSEvent)
    })
  })
})

describe('Action Performance', () => {
  describe('Given an action', () => {
    it('that returns no events, it runs successfully', () => {
      const testAction: CSAction = (c,r,e) => ({ state: c, events: [] });
      expect(() => performAction(testAction, demoCharState, demoRuleset, fixtures.environment({}))).not.toThrow();
    });
    it.skip('that returns events that propogate, it should run successfully', () => {
      const testAction: CSAction = (c,r,e) => ({
        state: c,
        events: [
          {
            name: 'ValueChanged',
            origin: 'attributes.Health',
          },
        ],
      });
      const res = performAction(testAction, demoCharState, demoRuleset, fixtures.environment({}));
      // expect(res.character.attributes.TestCounter.lvl).toStrictEqual(1);
      // expect(res.character.attributes.TestName.name).toStrictEqual('Test Name-Changed');
      // expect(res.character.attributes.Dexterity.lvl).toStrictEqual(15);
    });
  });
})
