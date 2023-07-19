import { CalculateBase } from "./utility";
import { describe,expect,test} from "@jest/globals"
import * as fixtures from "./fixtures"
import { Base, BaseType } from "./types";

const demoCharState = {
    character: fixtures.character({
        attributes: {
            "Dexterity": fixtures.attribute({name:"Dexterity",abbreviation:"DX",lvl:14}),
            "Health": fixtures.attribute({name:"Health",abbreviation:"HT",lvl:18})
        }
    }),
    registry: {}
}

describe(`CalculateBase`, () => {
    describe('Given a non-\'Base\' type', () => {
        test('With the numeral 10, returns text 10 and value 10', () => {
            const base:Base = 10
            expect(CalculateBase(base,demoCharState)).toStrictEqual({"itemsActive": [], "itemsWaiting": [], "text": "10", "value": 10})
        })
        test.failing('With undefined, errors and fails', () => {
            const base:Base = undefined
            CalculateBase(base,demoCharState)
        })
        test.failing('With null, errors and fails', () => {
            const base:Base = null
            CalculateBase(base,demoCharState)
        })
        test.failing('With a string, errors and fails', () => {
            const base:Base = "10" as any
            CalculateBase(base,demoCharState)
        })
    })
    describe('Given a Bracketed Base', () => {
        test('With 10 x 5, returns text ( 10 x 5 ) and value 50', () => {
            const base:Base = {
                type:BaseType.BRACKET,
                values: [10,5],
                operands: ["x"]
            }
            expect(CalculateBase(base,demoCharState)).toStrictEqual({"itemsActive": [], "itemsWaiting": [], "text": "( 10 x 5 )", "value": 50})
        })
        test('With 10 - 5 x 2, returns value 0, proving correct operand order', () => {
            const base:Base = {
                type:BaseType.BRACKET,
                values: [10,5,2],
                operands: ["-","x"]
            }
            expect(CalculateBase(base,demoCharState)).toStrictEqual({"itemsActive": [], "itemsWaiting": [], "text": "( 10 - 5 x 2 )", "value": 0})
        })
        test.failing('With three values and only 1 operand; errors and fails', () => {
            const base:Base = {
                type:BaseType.BRACKET,
                values: [10,5,2],
                operands: ["-"]
            }
            CalculateBase(base,demoCharState)
        })
        test.failing('With two values and two operands; errors and fails', () => {
            const base:Base = {
                type:BaseType.BRACKET,
                values: [10,5],
                operands: ["-","+"]
            }
            CalculateBase(base,demoCharState)
        })
    })
    describe('Given an Attribute Base', () => {
        test('With attribute equalling 14, returns 14', () => {
            const base:Base = {
                type: BaseType.ATTRIBUTE,
                key: "Dexterity",
                fallback: 10,
            }
            expect(CalculateBase(base,demoCharState)).toStrictEqual({"itemsActive": ["attributes.Dexterity"], "itemsWaiting": [], "text": "DX", "value": 14})
        })
        test('With attribute not existing and fallback value of 10, returns 10', () => {
            const base:Base = {
                type: BaseType.ATTRIBUTE,
                key: "Strength",
                fallback: 10,
            }
            expect(CalculateBase(base,demoCharState)).toStrictEqual({"itemsActive": [], "itemsWaiting": ["attributes.Strength"], "text": "?Strength?(10)", "value": 10})
        })
    })
    describe('Given a complex base', () => {
        test('With an attempt to resolve (DX + HT)/4, when DX = 14 and HT = 18, returns text ( DX + HT ) / 4 and value 8', () => {
            const base:Base = {
                type: BaseType.BRACKET,
                values: [
                    { 
                        type: BaseType.BRACKET,
                        values: [
                            {
                                type: BaseType.ATTRIBUTE,
                                key: "Dexterity",
                                fallback: 10
                            },
                            {
                                type: BaseType.ATTRIBUTE,
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
            const expectedState = {
                itemsActive: ["attributes.Dexterity","attributes.Health"],
                itemsWaiting: [],
                text: "( ( DX + HT ) / 4 )",
                value: 8
            }
            expect(CalculateBase(base,demoCharState)).toStrictEqual(expectedState)
        })
    })

})

export {}