import { AddSubscriptions, RemSubscriptions } from "./eventSystem";
import { SubscribedCSEventsMap } from "./types";
import { BaseResponse } from "./utility";
import { describe, expect, test } from "@jest/globals"

describe(`Subscribed Listeners`, () => {
  const emptyMap: SubscribedCSEventsMap = {}
  const filledMap: SubscribedCSEventsMap = {
    "AttributeCreated": {
      __all: ["RecalculateLevel", "RecalculateAll"],
      strength: ["RecalculateLevel"]
    },
    "AttributeDeleted": {
      dexterity: ["SomethingElse"]
    },
    "AttributeUpdated": {
      __all: ["RecalculateLevel", "SomethingElse"],
      strength: ["SomethingElse"]
    }
  }
  const emptyResponse: BaseResponse = {
    text: "",
    value: 0,
    listeners: []
  }
  const filledResponse: BaseResponse = {
    text: "",
    value: 0,
    listeners: [
      { objectPath: 'strength', eventName: 'AttributeUpdated' }, 
      { objectPath: 'strength', eventName: 'AttributeDeleted' }, 
      { objectPath: 'dexterity', eventName: 'AttributeUpdated' },
      { objectPath: 'dexterity', eventName: 'AttributeDeleted' }, 
    ]
  }
  describe('Removing listeners from a map', () => {
    test('With an already empty map, map remains empty', () => {
      const res = RemSubscriptions(emptyMap, 'SomethingElse')
      expect(Object.keys(res)).toHaveLength(0)
    })
    test('With a populated map, removes certain values', () => {
      const res = RemSubscriptions(filledMap, 'SomethingElse')
      expect(res).toEqual({
        "AttributeCreated": {
          __all: ["RecalculateLevel", "RecalculateAll"],
          strength: ["RecalculateLevel"]
        },
        "AttributeUpdated": {
          __all: ["RecalculateLevel"],
        }
      })
    })
  })
  describe('Adding listeners to a map', () => {
    test('with an empty map, and an empty base response, remains empty', () => {
      const res = AddSubscriptions(emptyMap,emptyResponse,'SomethingElse')
      expect(Object.keys(res)).toHaveLength(0)
    })
    test('with an empty map, and a base response, amends map appropriately', () => {
      const res = AddSubscriptions(emptyMap,filledResponse,'DoSomething')
      expect(res).toStrictEqual({
        "AttributeDeleted":{
          "strength": ["DoSomething"],
          "dexterity": ["DoSomething"],
        },
        "AttributeUpdated": {
          "strength": ["DoSomething"],
          "dexterity": ["DoSomething"]
        }
      })
    })
    test('with an working map, and a base response, amends map appropriately', () => {
      const res = AddSubscriptions(filledMap,filledResponse,'DoSomething')
      expect(res).toStrictEqual({
        AttributeCreated: {
          __all: ["RecalculateLevel", "RecalculateAll"],
          strength: ["RecalculateLevel"]
        },
        AttributeDeleted: {
          strength: ["DoSomething"],
          dexterity: ["SomethingElse","DoSomething"]
        },
        AttributeUpdated: {
          __all: ["RecalculateLevel", "SomethingElse"],
          strength: ["SomethingElse","DoSomething"],
          dexterity: ["DoSomething"]
        }
      })
    })
  })
})