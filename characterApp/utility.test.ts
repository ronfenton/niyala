import { BaseResponse, CalculateBase, CostMapLevelToPoints, CostMapPointsToLevel} from "./utility";
import { describe, expect, test } from "@jest/globals"
import * as fixtures from "./fixtures"
import { Base } from "./types";
import * as enums from "./enums"

const demoCharState = {
  character: fixtures.character({
    attributes: {
      "Dexterity": fixtures.attribute({ name: "Dexterity", abbreviation: "DX", lvl: 14 }),
      "Health": fixtures.attribute({ name: "Health", abbreviation: "HT", lvl: 18 })
    }
  }),
  registry: []
}

describe(`CalculateBase`, () => {
  describe('Given a non-\'Base\' type', () => {
    test('With the numeral 10, returns text 10 and value 10', () => {
      const base: Base = 10
      const res = CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})
      expect(res).toHaveProperty('text', "10")
      expect(res).toHaveProperty('value', 10)
    })
    test.failing('With undefined, errors and fails', () => {
      const base: Base = undefined
      CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})
    })
    test.failing('With null, errors and fails', () => {
      const base: Base = null
      CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})
    })
    test.failing('With a string, errors and fails', () => {
      const base: Base = "10" as any
      CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})
    })
  })
  describe('Given a Bracketed Base', () => {
    test('With 10 x 5, returns text ( 10 x 5 ) and value 50', () => {
      const base: Base = {
        type: enums.BaseType.BRACKET,
        values: [10, 5],
        operands: ["x"]
      }
      const res = CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})
      expect(res).toHaveProperty('text', "( 10 x 5 )")
      expect(res).toHaveProperty('value', 50)
    })
    test('With 10 - 5 x 2, returns value 0, proving correct operand order', () => {
      const base: Base = {
        type: enums.BaseType.BRACKET,
        values: [10, 5, 2],
        operands: ["-", "x"]
      }
      const res = CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})
      expect(res).toHaveProperty('text', "( 10 - 5 x 2 )")
      expect(res).toHaveProperty('value', 0)
    })
    test.failing('With three values and only 1 operand; errors and fails', () => {
      const base: Base = {
        type: enums.BaseType.BRACKET,
        values: [10, 5, 2],
        operands: ["-"]
      }
      CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})
    })
    test.failing('With two values and two operands; errors and fails', () => {
      const base: Base = {
        type: enums.BaseType.BRACKET,
        values: [10, 5],
        operands: ["-", "+"]
      }
      CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})
    })
  })
  describe('Given an Attribute Base', () => {
    test('With attribute equalling 14, returns 14', () => {
      const base: Base = {
        type: enums.BaseType.ATTRIBUTE,
        key: "Dexterity",
        fallback: 10,
      }
      const res = CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})
      expect(res).toHaveProperty('text', "DX")
      expect(res).toHaveProperty('value', 14)
      expect(res.listeners).toHaveLength(2)
    })
    test('With attribute not existing and fallback value of 10, returns 10', () => {
      const base: Base = {
        type: enums.BaseType.ATTRIBUTE,
        key: "Strength",
        fallback: 10,
      }
      const res = CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})
      expect(res).toHaveProperty('text', "?Strength?(10)")
      expect(res).toHaveProperty('value', 10)
      expect(res.listeners).toHaveLength(1)
    })
  })
  describe('Given a complex base', () => {
    test('With an attempt to resolve (DX + HT)/4, when DX = 14 and HT = 18, returns text ( DX + HT ) / 4 and value 8', () => {
      const base: Base = {
        type: enums.BaseType.BRACKET,
        values: [
          {
            type: enums.BaseType.BRACKET,
            values: [
              {
                type: enums.BaseType.ATTRIBUTE,
                key: "Dexterity",
                fallback: 10
              },
              {
                type: enums.BaseType.ATTRIBUTE,
                key: "Health",
                fallback: 10
              },
            ],
            operands: ["+"]
          },
          4
        ],
        operands: ["/"]
      }
      const expectedState: BaseResponse = {
        listeners: [
          {
            eventName: enums.CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
            origin: "attributes.Dexterity",
            listenerType: "obj",
            funcID:"func",
            listenerPath: "listenerobj",
          },
          {
            eventName: enums.CSEventNames.ATTRIBUTE_DELETED,
            origin: "attributes.Dexterity",
            listenerType: "obj",
            funcID:"func",
            listenerPath: "listenerobj",
          },
          {
            eventName: enums.CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
            origin: "attributes.Health",
            listenerType: "obj",
            funcID:"func",
            listenerPath: "listenerobj",
          },
          {
            eventName: enums.CSEventNames.ATTRIBUTE_DELETED,
            origin: "attributes.Health",
            listenerType: "obj",
            funcID:"func",
            listenerPath: "listenerobj",
          }
        ],
        text: "( ( DX + HT ) / 4 )",
        value: 8
      }
      expect(CalculateBase(base, demoCharState,{funcID:"func",listenerPath:"listenerobj",listenerType:"obj"})).toStrictEqual(expectedState)
    })
  })

})

describe(`Cost Table Calculations`, () => {
  describe(`Determining points for a given level`, () => {
    test(`With an item with no properties, returns 0`, () => {
      expect(CostMapLevelToPoints({},0)).toEqual(0)
    })
    test(`With an item with only flat, returns that flat`, () => {
      expect(CostMapLevelToPoints({ flat: 25 },0)).toEqual(25)
    })
    test(`With an item with per level costs, returns correct values.`, () => {
      expect(CostMapLevelToPoints({ perLvl: 25 },5)).toEqual(125)
      expect(CostMapLevelToPoints({ perLvl: 25 },-5)).toEqual(-125)
    })
    test(`With an item with progression costs, it returns correct values`, () => {
      expect(CostMapLevelToPoints({ progression: [5, 25, 50] },0)).toEqual(0)
      expect(CostMapLevelToPoints({ progression: [5, 25, 50] },1)).toEqual(5)
      expect(CostMapLevelToPoints({ progression: [5, 25, 50] },2)).toEqual(25)
      expect(CostMapLevelToPoints({ progression: [5, 25, 50] },3)).toEqual(50)
      expect(CostMapLevelToPoints({ progression: [5, 25, 50] },4)).toEqual(50)
    })
    test(`With an item with a base cost and a per level cost, returns base + bought levels`, () => {
      expect(CostMapLevelToPoints({ flat: 25, perLvl: 25 },2)).toEqual(75)
      expect(CostMapLevelToPoints({ flat: 25, perLvl: 25 },2)).toEqual(75)
    })
    test(`With an item with a base cost and a progressive cost, returns base + bought levels`, () => {
      expect(CostMapLevelToPoints({ flat: 25, progression: [5, 25, 50] },2)).toEqual(50)
    })
    test(`With an item with a combined progression and per-levels, it first uses progression levels, then per-levels.`, () => {
      expect(CostMapLevelToPoints({ perLvl: 9, progression: [5, 25, 50] },3)).toEqual(50)
      expect(CostMapLevelToPoints({ perLvl: 9, progression: [5, 25, 50] },4)).toEqual(59)
      expect(CostMapLevelToPoints({ perLvl: 9, progression: [5, 25, 50] },5)).toEqual(68)
      expect(CostMapLevelToPoints({ perLvl: 9, progression: [5, 25, 50] },0)).toEqual(0)
    })
  })
  describe(`Determining level from a given points`, () => {
    test(`With an item with no properties, returns 0`, () => {
      expect(CostMapPointsToLevel({},0)).toEqual(0)
    })
    test(`With an item with only a flat cost, returns 0`, () => {
      //TODO: Consider if this reflects a problem or not. I don't think so. Will probably have a check elsewhere for 'does X have enough points *for* that level'.
      expect(CostMapPointsToLevel({flat: 25},0)).toEqual(0)
      expect(CostMapPointsToLevel({flat: 25},25)).toEqual(0)
      expect(CostMapPointsToLevel({flat: 25},50)).toEqual(0)
    })
    test(`With an item with only per-level costs, correctly determines level from points`, () => {
      expect(CostMapPointsToLevel({perLvl:5},0)).toEqual(0)
      expect(CostMapPointsToLevel({perLvl:5},3)).toEqual(0)
      expect(CostMapPointsToLevel({perLvl:5},5)).toEqual(1)
      expect(CostMapPointsToLevel({perLvl:5},7)).toEqual(1)
      expect(CostMapPointsToLevel({perLvl:5},10)).toEqual(2)
      expect(Math.abs(CostMapPointsToLevel({perLvl:-5},0))).toEqual(0)
      expect(CostMapPointsToLevel({perLvl:-5},-3)).toEqual(0)
      expect(CostMapPointsToLevel({perLvl:-5},-5)).toEqual(1)
      expect(CostMapPointsToLevel({perLvl:-5},-7)).toEqual(1)
      expect(CostMapPointsToLevel({perLvl:-5},-10)).toEqual(2)
      expect(Math.abs(CostMapPointsToLevel({perLvl:5},0))).toEqual(0)
      expect(Math.abs(CostMapPointsToLevel({perLvl:5},-3))).toEqual(0)
      expect(CostMapPointsToLevel({perLvl:5},-5)).toEqual(-1)
      expect(CostMapPointsToLevel({perLvl:5},-7)).toEqual(-1)
      expect(CostMapPointsToLevel({perLvl:5},-10)).toEqual(-2)
    })
    test(`With an item with only progressive costs, correctly determines level from points`, () => {
      expect(CostMapPointsToLevel({progression:[5,25,75]},3)).toEqual(0)
      expect(CostMapPointsToLevel({progression:[5,25,75]},5)).toEqual(1)
      expect(CostMapPointsToLevel({progression:[5,25,75]},30)).toEqual(2)
      expect(CostMapPointsToLevel({progression:[5,25,75]},200)).toEqual(3)
    })
    test(`With an item with only progressive and levelled costs, correctly determines level from points`, () => {
      expect(CostMapPointsToLevel({progression:[5,25,75],perLvl:9},3)).toEqual(0)
      expect(CostMapPointsToLevel({progression:[5,25,75],perLvl:9},5)).toEqual(1)
      expect(CostMapPointsToLevel({progression:[5,25,75],perLvl:9},35)).toEqual(2)
      expect(CostMapPointsToLevel({progression:[5,25,75],perLvl:9},95)).toEqual(5)
      expect(CostMapPointsToLevel({progression:[-5,-25,-75],perLvl:-9},-3)).toEqual(0)
      expect(CostMapPointsToLevel({progression:[-5,-25,-75],perLvl:-9},-5)).toEqual(1)
      expect(CostMapPointsToLevel({progression:[-5,-25,-75],perLvl:-9},-35)).toEqual(2)
      expect(CostMapPointsToLevel({progression:[-5,-25,-75],perLvl:-9},-95)).toEqual(5)
    })
    test(`With an item with flat / custom and progression / levelled costs, determines level from points`, () => {
      expect(CostMapPointsToLevel({flat:5, progression:[5,25,75],perLvl:9},3)).toEqual(0)
      expect(CostMapPointsToLevel({flat:5, progression:[5,25,75],perLvl:9},5)).toEqual(0)
      expect(CostMapPointsToLevel({flat:5, progression:[5,25,75],perLvl:9},10)).toEqual(1)
      expect(CostMapPointsToLevel({flat:5, progression:[5,25,75],perLvl:9},80)).toEqual(3)
      expect(CostMapPointsToLevel({flat:5, progression:[5,25,75],perLvl:9},89)).toEqual(4)
      expect(CostMapPointsToLevel({flat:-5, progression:[-5,-25,-75],perLvl:-9},-89)).toEqual(4)
    })
  })
})

export { }