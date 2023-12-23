import { CharacteristicType } from "./enums";
import { CSTriggerRecord, CharacterState, Environment, Skill, Character, Characteristic, CSAction } from './types';
import { calcDerivedValue, costMapPointsToLevel, getModdedValue, getMods, calcModdedValue, getBaseValue } from "./utility";

const calculateLevel = (
  s: Skill,
  k: string,
  env: Environment,
  state: CharacterState,
): { s: Skill; baseListeners: CSTriggerRecord[] } => {
  const Base = calcDerivedValue(s.base, state);
  const pts = calcModdedValue(s,getBaseValue(s.points),getMods(CharacteristicType.SKILLS,k,'points',state),state);
  const BoughtLevels = costMapPointsToLevel(
    {progression: [1, 2, 4], perLvl: 4},
    getModdedValue(pts.value),
  );
  const Level =BoughtLevels +  s.lvlMod + s.difficulty;
  const mods = getMods(CharacteristicType.ATTRIBUTES, k, 'lvl', state);
  const ModdedLevel = calcModdedValue(s, Level, mods, state);
  const newSkill = {
    ...s,
    lvlBase: Base.value,
    points: pts.value,
    lvl: ModdedLevel.value,
    lvlPurchase: BoughtLevels,
    lvlSkill: getModdedValue(ModdedLevel.value) + Base.value,
  };
  return {  
    s: newSkill,
    baseListeners: [...Base.updateTriggers, ...ModdedLevel.triggers],
  };
};

const updateDefault = (
  s: Skill,
  k: string,
): CSAction => (env:Environment, state:CharacterState) => {
  if(s.points === 0) {
    
  }
  return {
    state,
    events: [],
  }
}