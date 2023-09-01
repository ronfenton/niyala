import { describe, expect, test } from "@jest/globals"
import { PerformAction } from "./character"
import * as fixtures from "./fixtures"
import type { CSAction, CharacterState, Environment, EventActionMap } from "./types"
import _ from "lodash/fp"

const demoCharState:CharacterState = {
  character: fixtures.character({
    attributes: {
      "Dexterity": fixtures.attribute({ name: "Dexterity", abbreviation: "DX", lvl: 14 }),
      "Health": fixtures.attribute({ name: "Health", abbreviation: "HT", lvl: 18 }),
      "TestCounter": fixtures.attribute({name:"Test Counter", lvl: 0 }),
      "TestName": fixtures.attribute({name:"Test Name" }),
    },
  }),
  registry: [
    {
      eventName: "ValueChanged",
      origin: "attributes.Health",
      listenerPath: "attributes.TestCounter",
      listenerType: "test",
      funcID: "incValue"
    },
    {
      eventName: "ValueChanged",
      origin: "attributes.TestCounter",
      listenerPath: "attributes.TestName",
      listenerType: "test",
      funcID: "changeName"
    },
    {
      eventName: "NameChanged",
      listenerPath: "attributes.Dexterity",
      listenerType: "test",
      funcID: "incValue"
    }
  ]
}

const testEnvironmentWithResult = ({ bool, number, text, select }: { bool?, number?, text?, select?}): Environment => {
  return {
    logger: {
      debug: (x) => { },
      log: (x) => { },
      warn: (x) => { },
      error: (x) => { },
      fatal: (x) => { },
    },
    prompter: {
      bool: (ctx) => bool,
      number: (ctx) => number,
      text: (ctx) => text,
      select: (ctx, opts, def) => select,
    },
    ruleset: {},
  }
}

describe(`Given an action`, () => {
  const eventActionMap: EventActionMap = {
    test: {
      incValue: (e, state, path, data) => {
        // this simply increments the listener's value.
        const currentVal = _.get("character."+path+".lvl")(state) || 0;
        return {
          state: _.set("character."+path+".lvl")(currentVal+1)(state),
          events: [
            {
              name:"ValueChanged",
              origin: path,
              data: { value: currentVal+1 }
            }
          ],
        }
      },
      changeName: (e, state, path, data) => {
        // this simply changes the listener's name.
        const currentVal = _.get("character."+path+".name")(state) || "EmptyName";
        return {
          state: _.set("character."+path+".name")(currentVal+"-Changed")(state),
          events: [
            {
              name:"NameChanged",
              origin: path,
              data: { value: currentVal+"-Changed" }
            }
          ],
        }
      },
    }
  }
  test('That returns no events, it runs successfully', () => {
    const testAction: CSAction = (e, c) => { return { state: c, events: [] } }
    PerformAction(testEnvironmentWithResult({}), demoCharState, testAction, eventActionMap)
  })
  test('That returns events that propogate, it should run successfully', () => {
    const testAction: CSAction = (e, c) => {
      return {
        state: c, events: [
          {
            name: "ValueChanged",
            origin: "attributes.Health",
          }
        ]
      }
    }
    const res = PerformAction(testEnvironmentWithResult({}), demoCharState, testAction, eventActionMap)
    expect(res.character.attributes["TestCounter"].lvl).toEqual(1)
    expect(res.character.attributes["TestName"].name).toEqual("Test Name-Changed")
    expect(res.character.attributes["Dexterity"].lvl).toEqual(15)
  })
})