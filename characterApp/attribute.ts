import type { Attribute, Context } from "./types";
import { CalculateBase } from './utility'

const RecalculateLevel = (ctx: Context, a:Attribute):Attribute => {
  const base = CalculateBase(a.base, ctx.state)
  const level = base.value + a.lvlMod + a.lvlPurchase
  const listeners = [...base.itemsActive,...base.itemsWaiting].map(x => { return { [`LevelChange-${x}`]: [x]}})
  return {
    ...a,
    lvl:level,
  }
}