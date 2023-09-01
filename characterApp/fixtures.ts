import { Attribute, Character } from "./types";

export const attribute = (x:Partial<Attribute>):Attribute => {
  const a:Attribute = {
    name: 'Attribute',
    description: 'Description',
    base: 10,
    lvlBase: 10,
    lvlMod: 0,
    lvlPurchase: 0,
    lvlBought: 0,
    lvl:10,
    tags:[],
    points:0,
    levelMap: {
    },
    ...x
  }
  return a
}

export const character = (x:Partial<Character>):Character => {
  const c:Character = {
    attributes: {},
    skills: {},
    items: {},
    resources: {},
    version: { current: "0", last: "-1" },
    id: "0",
    ...x
  }
  return c
}