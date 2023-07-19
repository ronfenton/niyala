
/////////////////////////////////
export enum BaseType {
  UNKNOWN,
  VALUE,
  BRACKET,
  TRIG,
  AGGREGATE,
  ROUND,
  LOG,
  POWER,
  ATTRIBUTE,
  SKILL,
  TECHNIQUE,
}

export type ModdableValue = number | {
  base: number,
  modded: number,
  mods: any[],
}

export type ModdableString = string | {
  base: string,
  modded: string,
  mods: any[],
}

export type PrompterSettings = {
  title: string,
  description: string,
  permitCancel: boolean,
}

export type Environment = {
  logger: Logger
  prompter: Prompter
}

export type Logger = {
  debug: (x:string) => void
  log: (x:string) => void
  warn: (x: string) => void
  error: (x: string) => void
  fatal: (x: string) => void
}

export type Prompter = {
  bool: (context:PrompterSettings) => boolean
  number: (context:PrompterSettings) => number
  text: (context:PrompterSettings) => string
  select: (context:PrompterSettings,options:string[],defaultSelect:string) => string
}

// For flat values without references; eg = 10.
export type BaseValue = {
  type: BaseType.VALUE,
  value: number,
}

// For operations between two values; EG = a x b
export type BaseOperand = "x" | "/" | "-" | "+"

export type BaseBracket = {
  type: BaseType.BRACKET,
  values: Base[],
  operands: BaseOperand[]
}

// For a value retrieved from an Attribute; where key is the attribute key, and fallback to be the value to use if the attribute is not found.
export type BaseAttribute = {
  type: BaseType.ATTRIBUTE,
  key: string,
  fallback: Base,
}

// As skill.
export type BaseSkill = {
  type: BaseType.SKILL,
  key: string,
  fallback: Base,
  attribute?: string,
  techniques?: BaseTechnique[],
}

export type BaseTechnique = {
  type: BaseType.TECHNIQUE,
  key: string,
  fallback: Base,
}

export type Base = BaseValue | BaseBracket | BaseAttribute | BaseSkill | BaseTechnique | number

///////////////////////////////
export type CharacterState = {
  character: Character
  registry: ListenerMap
}

export type Character = {
  id: string
  version: Version
  attributes: {
    [key:string]: Attribute
  }
  skills: {
    [key:string]: Skill
  }
  items: {
    [uuid:string]: InventoryItem
  }
}

export type Version = {
  current: string
  last: string
}

export type Characteristic = {
  name: string,
  library?: LibraryReference,
  description: string,
  tags: string[],
}

export type LibraryReference = {
  libraryId: string
  objectId: string
}

export type Identity = {
  nickname?: string
  fullName: string
  description: string
}

export type Levelled = {
  lvlPurchase: number
  lvlMod: number
  lvl: number
}

export type Attribute = Characteristic & Levelled & {
  base: Base,
  lvlBase: number,
  abbreviation?: string
}

export type Skill = Characteristic & Levelled & {
  bases: Base[],
  selBase: number,
  difficulty: number
}

export type InventoryItem = Characteristic & {
  qty: number
  wt: number
  val: number
}

export type Module = {
  name: string
  id: string
  attributes: {
    [uuid:string]: Attribute
  }
  skills: {
    [uuid:string]: Skill
  }
  templates: {  
    [uuid:string]: CharacterTemplate
    
  }
}

export type CharacterTemplate = {
  attributes: {
    [uuid:string]: { level: number, modifiers: [] }
  }
}

export enum CharacterPermissionRole {
  UNKNOWN,
  OWNER,
  GM,
  EDITOR,
  VIEWER,
  ALLY,
}

export type PermissionList = {
  [useruuid:string]: CharacterPermissionRole
}

export type ListenerRecord = {
  listenerPath: string,
  func: string,
}

export type ListeningEvents = {
  [eventName: string]:string[]
}

export type ListenerMap = {
  [eventName:string]:ListenerRecord[]
}

export enum CostModType {
  UNKNOWN,
  FLAT,
  MULTIPLIER,
  COSTFACTOR,
}

export type CostLevelMap = {
  flat?: number // Flat Price.
  perLvl?: number // if present, property can be levelled up/down for a flat cost.
  progression?: number[] // For cases with a large variability or multiple, costed options that may or may not be linear.
  minLvl?: number // if present, sets min lvl most important for perLvl costs
  maxLvl?: number // if present, sets max lvl most important for perLvl costs
  custom?: number // for cases of truly variable price - no +/- offered, must be set manually
}

export type CostModifier = {
  name: string,
  description: string,
  lvl: number,
  perLvl: boolean,
  type: number,
}

export type Cost = {
  currency: string
  levelMap: CostLevelMap
  modifiers: CostModifier[]
  value: number
}
