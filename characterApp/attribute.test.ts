import { describe, expect, test, xdescribe } from "@jest/globals"
import * as fixtures from "./fixtures"
import { AttributeEventsHandler, InsertAttribute, RecalculateLevel } from "./attribute"
import { PrompterSettings, Environment, Attribute } from "./types"
import { BaseType, CSEventNames, Operands } from "./enums"
import _ from "lodash/fp"
import { PerformAction } from "./character"

const demoCharState = {
  character: fixtures.character({
    attributes: {
      "Dexterity": fixtures.attribute({ name: "Dexterity", abbreviation: "DX", lvl: 14 }),
      "Health": fixtures.attribute({ name: "Health", abbreviation: "HT", lvl: 18 }),
      "Basic_Speed": fixtures.attribute({
        name: "Basic Speed", 
        abbreviation: "BS", 
        lvl: 8,
        base: {
          type: BaseType.BRACKET,
          values: [
            {
              type: BaseType.ATTRIBUTE,
              key: "Dexterity",
              fallback: 10,
            },
            {
              type: BaseType.ATTRIBUTE,
              key: "Health",
              fallback: 10,
            }
          ],
          operands: [
            "+"
          ]
        }
      })
    }
  }),
  registry: []
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

describe(`Character Functions`, () => {
  describe(`Given an InsertAttribute request`, () => {
    test(`With a new attribute, it is added`, () => {
      const newState = InsertAttribute(fixtures.attribute({ name: "Strength", abbreviation: "ST", lvl: 10 }), {})(testEnvironmentWithResult({}), { ...demoCharState })
      expect(newState.state.character).toHaveProperty("attributes.Strength")
    })
    test.failing(`With an existing attribute and no handling method, then it errors`, () => {
      InsertAttribute(fixtures.attribute({ name: "Dexterity" }), {})(testEnvironmentWithResult({}), { ...demoCharState })
    })
    test(`With an existing attribute and the overwrite command, then it is replaced`, () => {
      const newState = InsertAttribute(fixtures.attribute({ name: "Dexterity", abbreviation: "DX", lvl: 10 }), { conflictMethod: "overwrite" })(testEnvironmentWithResult({}), { ...demoCharState })
      expect(newState.state.character).toHaveProperty("attributes.Dexterity.lvl", 10)
    })
    test(`With an existing attribute and the ignore command, then the original is maintained`, () => {
      const newState = InsertAttribute(fixtures.attribute({ name: "Dexterity", abbreviation: "DX", lvl: 10 }), { conflictMethod: "ignore" })(testEnvironmentWithResult({}), { ...demoCharState })
      expect(newState.state.character).toHaveProperty("attributes.Dexterity.lvl", 14)
    })
    test(`With an existing attribute and the prompt command, then then it respects the prompted response (overwrite)`, () => {
      const newState = InsertAttribute(fixtures.attribute({ name: "Dexterity", abbreviation: "DX", lvl: 10 }), { conflictMethod: "prompt" })(testEnvironmentWithResult({ select: "overwrite" }), { ...demoCharState })
      expect(newState.state.character).toHaveProperty("attributes.Dexterity.lvl", 10)
    })
  })
  describe(`Given a recalculate attribute level request`, () => {
    test(`With an attribute with a base, it correctly updates listeners and event handlers`, () => {
      const BasicSpeed:Attribute = fixtures.attribute({name: "Basic Speed", abbreviation: "BS", lvl: 5,base:{
        type:BaseType.ATTRIBUTE,
        key:"Dexterity",
        fallback: 5
      }})
      const newState = RecalculateLevel(`attributes.Basic_Speed`)(testEnvironmentWithResult({}),_.set(`character.attributes.Basic_Speed`,BasicSpeed)(demoCharState))
      const finalState = PerformAction(testEnvironmentWithResult({}),_.set(`character.attributes.Dexterity.base`)(12)(newState.state),RecalculateLevel(`attributes.Dexterity`),{Attribute: AttributeEventsHandler})
      expect(finalState.character).toHaveProperty(`attributes.Basic_Speed.lvl`,12) // confirm propogation of event from Dex update.
    })
  })
})