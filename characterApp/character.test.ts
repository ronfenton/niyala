import { describe,expect,test, xdescribe} from "@jest/globals"
import * as fixtures from "./fixtures"
import {InsertAttribute} from "./character"
import { PrompterSettings, Environment } from "./types"

const demoCharState = {
    character: fixtures.character({
        attributes: {
            "Dexterity": fixtures.attribute({name:"Dexterity",abbreviation:"DX",lvl:14}),
            "Health": fixtures.attribute({name:"Health",abbreviation:"HT",lvl:18})
        }
    }),
    registry: {}
}

const testEnvironmentWithResult = ({bool,number,text,select}:{bool?,number?,text?,select?}):Environment => {
    return {
        logger: {
            debug: (x) => {},
            log: (x) => {},
            warn: (x) => {},
            error: (x) => {},
            fatal: (x) => {},
        },
        prompter: {
            bool: (ctx) => bool,
            number: (ctx) => number,
            text: (ctx) => text,
            select: (ctx,opts,def) => select,
        }
    }
}

describe(`Character Functions`, () => {
    describe(`Given an InsertAttribute request`, () => {
        test(`With a new attribute, it is added`,() => {
            const newState = InsertAttribute(testEnvironmentWithResult({}),{...demoCharState},fixtures.attribute({name:"Strength",abbreviation:"ST",lvl:10}),{})
            expect(newState.state.character).toHaveProperty("attributes.Strength")
        })
        test.failing(`With an existing attribute and no handling method, then it errors`,() => {
            InsertAttribute(testEnvironmentWithResult({}),{...demoCharState},fixtures.attribute({name:"Dexterity",abbreviation:"DX",lvl:10}),{})
        })
        test(`With an existing attribute and the overwrite command, then it is replaced`,() => {
            const newState = InsertAttribute(testEnvironmentWithResult({}),{...demoCharState},fixtures.attribute({name:"Dexterity",abbreviation:"DX",lvl:10}),{conflictMethod:"overwrite"})
            expect(newState.state.character).toHaveProperty("attributes.Dexterity.lvl",10)
        })
        test(`With an existing attribute and the ignore command, then the original is maintained`,() => {
            const newState = InsertAttribute(testEnvironmentWithResult({}),{...demoCharState},fixtures.attribute({name:"Dexterity",abbreviation:"DX",lvl:10}),{conflictMethod:"ignore"})
            expect(newState.state.character).toHaveProperty("attributes.Dexterity.lvl",14)
        })
        test(`With an existing attribute and the prompt command, then then it respects the prompted response (overwrite)`,() => {
            const newState = InsertAttribute(testEnvironmentWithResult({select:"overwrite"}),{...demoCharState},fixtures.attribute({name:"Dexterity",abbreviation:"DX",lvl:10}),{conflictMethod:"prompt"})
            expect(newState.state.character).toHaveProperty("attributes.Dexterity.lvl",10)
        })
    }) 
})