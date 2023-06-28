import type { Attribute, Context } from "./types";
import { CalculateBase } from './utility'

const recalculateLevel = (ctx: Context, a:Attribute):Attribute => {
  const base = CalculateBase(a.base, ctx.state)
  const level = base.value + a.lvlMod + a.lvlPurchase
  return {
    ...a,
    lvl:level,
  }
}

export const RecalculateAll = (ctx:Context, a:Attribute):Attribute => {
  return recalculateLevel(ctx, a)
}

