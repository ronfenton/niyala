import * as ENUMS from "./enums"
/////////////////////////////////
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
  ruleset: Ruleset
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

export type InsertOptions = {
  conflictMethod?: "prompt" | "ignore" | "duplicate" | "overwrite" | "combinelevel" | "combinepoints" | "error",
  keyOverride?: string
}

// For flat values without references; eg = 10.
export type BaseValue = {
  type: ENUMS.BaseType.VALUE,
  value: number,
}

// For operations between two values; EG = a x b
export type BaseOperand = "x" | "/" | "-" | "+"

export type BaseBracket = {
  type: ENUMS.BaseType.BRACKET,
  values: Base[],
  operands: BaseOperand[]
}

// For a value retrieved from an Attribute; where key is the attribute key, and fallback to be the value to use if the attribute is not found.
export type BaseAttribute = {
  type: ENUMS.BaseType.ATTRIBUTE,
  key: string,
  fallback: Base,
}

// As skill.
export type BaseSkill = {
  type: ENUMS.BaseType.SKILL,
  key: string,
  fallback: Base,
  attribute?: string,
  techniques?: BaseTechnique[],
}

export type BaseTechnique = {
  type: ENUMS.BaseType.TECHNIQUE,
  key: string,
  fallback: Base,
}

export type Base = BaseValue | BaseBracket | BaseAttribute | BaseSkill | BaseTechnique | number

///////////////////////////////
export type CharacterState = {
  character: Character
  registry: CSListenerRecord[]
}

export type Ruleset = object

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
  },
  resources: {
    [key:string]: Resource
  }
}

export type CSAction = (e:Environment,c:CharacterState) => {state:CharacterState,events:CSEvent[]}

export type CSEventAction = (env:Environment, state:CharacterState,path:string,data:any) => {state:CharacterState,events:CSEvent[]}

export type EventActionMap = {
  [type:string]: {
    [functionName:string]: CSEventAction
  }
}


export type CSListenerRecord = {
  eventName: string,
  listenerPath: string,
  listenerType: string,
  origin?: string,
  funcID: string,
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
  base: Base,
  lvlBase: number,
  lvlPurchase: number
  lvlMod: number
  lvl: ModdableValue
}

export type CostedObject = {
  levelMap: CostLevelMap,
  points: ModdableValue,
  lvlBought: ModdableValue,
}

export type Attribute = Characteristic & Levelled & CostedObject & {
  abbreviation?: string
}

export type CharacteristicModifier = Characteristic & {
  type: string, // Type of characteristic.
  value: Base,
  operand: string,
  priority?: number,
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

export type Resource = {
  value: number,
  permitDebt: boolean,
  transactions: TransactionRecord[]
}

export type TransactionRecord = {
  time: Date,
  value: number,
  description: string,
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

export type PermissionList = {
  __default: ENUMS.CharacterPermissionRole,
  [useruuid:string]: ENUMS.CharacterPermissionRole
}

/**
 * A CSEvent is a Character Sheet Event caused by changes that might propogate.
 * @name: the event name
 * @origin: the path to the calling object, used for filtering. optional.
 * @data: a payload of any relevant data to the event, such as fields changed, etc.
 */
export type CSEvent = {
  name: string,
  origin?: string,
  data?: any,
}

/**
 * FuncIDs is just a TS Helper to remind the user that items in this array
 * are supposed to be function IDs, to identify the functions called by a
 * triggered event.
 */
type FuncID = string

/**
 * ObjectPath is just a TS Helper to remind the user that items in this array
 * are supposed to be object paths within the character sheet.
 */
type ObjectPath = string

// Possibly replace this in event logic? Might make some things easier; reduce need for 'splits' and make key mapping
type ObjectReference = {
  type: string,
  key: string,
}

/**
 * SubscribedCSEventsMap is a object-local record of which events it is listening to, 
 * from which origins (using __all for 'all events of this type'), and which 
 * functions it will call. 
 */
export type SubscribedCSEventsMap = {
  [eventName:string]: {
    __all?:FuncID[],
    [origin:ObjectPath]:FuncID[],
  }
}

/**
 * CSListenerMap is the full map record of all events, and the objects listening to them.
 */
export type CSListenerMap = {
  [eventName:string]: {
    __all?: ObjectPath[],
    [origin:ObjectPath]: ObjectPath[]
  }
}

export type CostLevelMap = {
  flat?: number // Flat Price.
  perLvl?: number // if present, property can be levelled up/down for a flat cost.
  minLvl?: number // if present, sets min lvl most important for perLvl costs
  maxLvl?: number // if present, sets max lvl most important for perLvl costs
  progression?: number[] // For cases with a large variability or multiple, costed options that may not be linear.
  custom?: number // for cases of truly variable price - no +/- offered, must be set manually
  extra?: number // extra points that are not affected by mods.
}

export type CostModifier = {
  name: string,
  description: string,
  lvl: number,
  perLvl: boolean,
  type: ENUMS.CostModType,
}
