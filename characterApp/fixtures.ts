import { Attribute, BaseType, Character } from "./types";

export const attribute = (x:Partial<Attribute>):Attribute => {
  const a:Attribute = {
    name: 'Example Attribute',
    description: 'A token example **here**.',
    base: { type: BaseType.VALUE, value: 10 },
    lvlBase: 10,
    lvlMod: 0,
    lvlPurchase: 0,
    lvl:0,
    tags:[],
    ...x
  }
  return a
}

export const character = (x:Partial<Character>):Character => {
  const c:Character = {
    attributes: {},
    skills: {},
    items: {},
    version: { current: "0", last: "-1" },
    id: "0",
    ...x
  }
  return c
}