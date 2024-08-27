import * as ENUMS from './enums';
// ///////////////////////////////
export type ModdableValue =
  | number
  | {
      base: number;
      modded: number;
      mods: unknown[];
    };

export type ModdableString =
  | string
  | {
      base: string;
      modded: string;
      mods: unknown[];
    };

export type Logger = {
  debug: (x: string) => void;
  log: (x: string) => void;
  warn: (x: string) => void;
  error: (x: string) => void;
  fatal: (x: string) => void;
};

export type PrompterSettings = {
  title: string;
  description: string;
  permitCancel: boolean;
};

export type Prompter = {
  bool: (context: PrompterSettings) => boolean;
  number: (context: PrompterSettings) => number;
  text: (context: PrompterSettings) => string;
  select: (
    context: PrompterSettings,
    options: string[],
    defaultSelect: string,
  ) => string;
};

/**
 * FuncIDs is just a TS Helper to remind the user that items in this array
 * are supposed to be function IDs, to identify the functions called by a
 * triggered event.
 */
type FuncID = string;

/**
 * ObjectPath is just a TS Helper to remind the user that items in this array
 * are supposed to be object paths within the character sheet.
 */
type ObjectPath = string;

export type InsertOptions = {
  conflictMethod?:
    | 'prompt'
    | 'ignore'
    | 'duplicate'
    | 'overwrite'
    | 'combinelevel'
    | 'combinepoints'
    | 'error';
  keyOverride?: string;
};

export type DerivedArrayCharacteristic = {
  type: 'characteristic';
  fallback: unknown;
  charType: ENUMS.CharacteristicType;
  key: string | '__parent' | '__subject';
  property: string;
};

export type DerivedBooleanExplicit = {
  type: 'boolean';
  value: boolean;
};

export type DerivedBooleanCharacteristic = {
  type: 'characteristic';
  // eslint-disable-next-line no-use-before-define
  fallback: DerivedBoolean;
  charType: ENUMS.CharacteristicType;
  key: string | '__parent' | '__subject';
  property: string;
};

export type DerivedBoolean =
  | DerivedBooleanExplicit
  | DerivedBooleanCharacteristic
  | boolean;

export type DerivedStringExplicit = {
  type: ENUMS.DerivedStringType.STRING;
  value: string;
};

export type DerivedStringCharacteristic = {
  type: ENUMS.DerivedStringType.CHARACTERISTIC;
  fallback: any;
  charType: ENUMS.CharacteristicType;
  key: string | '__parent' | '__subject';
  property: string;
};

export type DerivedString =
  | DerivedStringExplicit
  | DerivedStringCharacteristic
  | string;

// For flat values without references; eg = 10.
export type DerivedValueExplicit = {
  type: ENUMS.DerivedValueType.VALUE;
  value: number;
};

// For operations between two values; EG = a x b
export type BaseOperand = 'x' | '/' | '-' | '+';

export type DerivedValueBracket = {
  type: ENUMS.DerivedValueType.BRACKET;
  // eslint-disable-next-line no-use-before-define
  values: DerivedValue[];
  operands: BaseOperand[];
};

export type DerivedValueCharacteristic = {
  type: ENUMS.DerivedValueType.CHARACTERISTIC;
  charType: ENUMS.CharacteristicType;
  key: string | '__parent' | '__subject';
  // eslint-disable-next-line no-use-before-define
  fallback: DerivedValue;
  property: string;
  unmodded?: boolean;
};

export type DerivedValue =
  | DerivedValueExplicit
  | DerivedValueBracket
  | DerivedValueCharacteristic
  | number;

export type CostLevelMap = {
  flat?: number; // Flat Price.
  perLvl?: number; // if present, property can be levelled up/down for a flat cost.
  minLvl?: number; // if present, sets min lvl most important for perLvl costs
  maxLvl?: number; // if present, sets max lvl most important for perLvl costs
  progression?: number[]; // For cases with a large variability or multiple, costed options that may not be linear.
  custom?: number; // for cases of truly variable price - no +/- offered, must be set manually
  extra?: number; // extra points that are not affected by mods.
};

export type CostModifier = {
  name: string;
  description: string;
  lvl: number;
  perLvl: boolean;
  type: ENUMS.CostModType;
};

export type CSTriggerRecord = {
  eventName: string;
  origin?: string;
};

export type CSListenerRecord = CSTriggerRecord & {
  listeningCharKey: string;
  listeningCharType: string;
  funcID: string;
};

export type Version = {
  current: string;
  last: string;
};

export type LibraryReference = {
  libraryId: string;
  objectId: string;
};

export type Characteristic = {
  name: string;
  library?: LibraryReference;
  description: string;
  tags: string[];
};

export type Identity = {
  nickname?: string;
  fullName: string;
  description: string;
};

export type Levelled = {
  base: DerivedValue;
  lvlBase: number;
  lvlMod: number;
  lvl: ModdableValue;
};

export type CostedObject = {
  levelMap: CostLevelMap;
  points: ModdableValue;
  lvlBought: ModdableValue;
};

export type Attribute = Characteristic &
  Levelled &
  CostedObject & {
    abbreviation?: string;
  };

export type Statistic = Characteristic & {
  valueStruct: DerivedValue;
  value: number;
};

export type Skill = Characteristic &
  Levelled &
  CostedObject & {
    defBase: DerivedValue;
    lvlSkill: ModdableValue;
    difficulty: number;
    specialisation?: {
      name: string;
      description: string;
    };
    disabled?: boolean;
    defaults: {
      attribute?: number;
      skills?: { name: string; specialisation?: string; offset: number }[];
      current?: { type: 'skill' | 'attribute'; skill?: string; specialisation?: string };
    };
  };

export type ObjectModifierMap = {
  [key in ENUMS.CharacteristicType]?: {
    [objectKey: ObjectPath]: {
      [targetKey: string]: ObjectPath[];
    };
  };
};

export type InventoryItem = Characteristic & {
  qty: number;
  wt: number;
  val: number;
};

export type TransactionRecord = {
  time: Date;
  value: number;
  description: string;
};

export type Resource = {
  value: number;
  permitDebt: boolean;
  transactions: TransactionRecord[];
};

export type CharacterTemplate = {
  attributes: {
    [uuid: string]: { level: number; modifiers: [] };
  };
};

export type Module = {
  name: string;
  id: string;
  attributes: {
    [uuid: string]: Attribute;
  };
  skills: {
    [uuid: string]: Skill;
  };
  templates: {
    [uuid: string]: CharacterTemplate;
  };
};

export type PermissionList = {
  __default: ENUMS.CharacterPermissionRole;
  [useruuid: string]: ENUMS.CharacterPermissionRole;
};

export type CharacteristicDefinition = {
  key: ENUMS.CharacteristicType,
  functions: {
    create?: (key:string, obj: Characteristic) => CSAction,
    delete?: (key:string, obj: Characteristic) => CSAction,
    generateKey: (o:Characteristic) => string,
  },
  createEvent: ENUMS.CSEventNames;
  deleteEvent: ENUMS.CSEventNames;
  moddableValues: {
    [keyName: string]: {
      type: 'value' | 'string';
      funcID: string;
      displayName: string;
    };
  };
  selectableValues: {
    [keyName: string]: {
      type: 'moddableValue' | 'moddableString' | 'value' | 'string' | 'boolean';
      changeEvent: ENUMS.CSEventNames;
      stringFunc: (obj) => string;
    };
  };
};

export type CharacteristicSettings = {
  [key in ENUMS.CharacteristicType]?: CharacteristicDefinition;
};

export type ComparatorValue = {
  type: 'value';
  a: DerivedValue;
  b: DerivedValue;
  comparator: '>' | '<' | '=' | '!=';
};

export type ComparatorString = {
  type: 'string';
  a: DerivedString;
  b: DerivedString;
  comparator: 'regex' | 'includes' | 'is';
};

export type ComparatorBoolean = {
  type: 'boolean';
  a: DerivedBoolean;
  b: DerivedBoolean;
};

export type ComparatorAutomatic = {
  type: 'auto';
  result: boolean;
};

export type ComparatorLogic = {
  type: 'logic';
  operator: 'OR' | 'AND' | 'NOR';
  selectors: (
    | ComparatorValue
    | ComparatorString
    | ComparatorBoolean
    | ComparatorLogic
    | ComparatorAutomatic
  )[];
};

export type Comparator =
  | ComparatorValue
  | ComparatorString
  | ComparatorBoolean
  | ComparatorLogic
  | ComparatorAutomatic;

export type ObjectModifierBase = {
  targetProp: string;
  effectType: ENUMS.ModifierEffectType;
  priority?: number;
};

export type ObjectModifierValue = ObjectModifierBase & {
  effectType: ENUMS.ModifierEffectType.VALUE;
  operand: ENUMS.ValueOperands;
  value: DerivedValue;
};

export type ObjectModifierString = ObjectModifierBase & {
  effectType: ENUMS.ModifierEffectType.STRING;
  operand: ENUMS.StringOperands;
  string: DerivedString;
};

export type ObjectModifierEffect = ObjectModifierValue | ObjectModifierString;

export type ObjectModifier = Characteristic & {
  selector: {
    charType: ENUMS.CharacteristicType;
    limitKeys?: string[]; // list of object keys used by filters.
    excludeKeys?: string[];
    filter: Comparator;
  };
  effect: ObjectModifierEffect;
};

export type Character = {
  id: string;
  version: Version;
  attributes: {
    [key: string]: Attribute;
  };
  skills: {
    [key: string]: Skill;
  };
  items: {
    [uuid: string]: InventoryItem;
  };
  resources: {
    [key: string]: Resource;
  };
  objectMods: {
    [uuid: string]: ObjectModifier;
  };
  [ENUMS.CharacteristicType.TESTING]?: {

  };
  objectModifierRegister?: ObjectModifierMap;
};

// /////////////////////////////
export type CharacterState = {
  character: Character;
  registry: CSListenerRecord[];
};

export type Ruleset = {
  characteristics: CharacteristicSettings
}

export type Environment = {
  logger: Logger;
  prompter: Prompter;
  ruleset: Ruleset;
};

/**
 * A CSEvent is a Character Sheet Event caused by changes that might propogate.
 * @name: the event name
 * @origin: the path to the calling object, used for filtering. optional.
 * @data: a payload of any relevant data to the event, such as fields changed, etc.
 */
export type CSEvent = {
  name: string;
  origin?: string;
  data?: unknown;
};

/**
 * SubscribedCSEventsMap is a object-local record of which events it is listening to,
 * from which origins (using __all for 'all events of this type'), and which
 * functions it will call.
 */
export type SubscribedCSEventsMap = {
  [eventName: string]: {
    __all?: FuncID[];
    [origin: ObjectPath]: FuncID[];
  };
};

/**
 * CSListenerMap is the full map record of all events, and the objects listening to them.
 */
export type CSListenerMap = {
  [eventName: string]: {
    __all?: ObjectPath[];
    [origin: ObjectPath]: ObjectPath[];
  };
};

export type CSAction = (
  e: Environment,
  c: CharacterState,
) => { state: CharacterState; events: CSEvent[] };

export type CSEventAction = (
  env: Environment,
  state: CharacterState,
  path: string,
  data: unknown,
) => { state: CharacterState; events: CSEvent[] };

export type CharacteristicEventActionMap = {
  [functionName: string]: CSEventAction;
};

export type EventActionMap = {
  [key in ENUMS.CharacteristicType]?: CharacteristicEventActionMap;
};

export type DerivedResult = {
  text: string;
  updateTriggers: CSTriggerRecord[];
};

export type DerivedValueResult = DerivedResult & {
  value: number;
};

export type DerivedStringResult = DerivedResult & {
  string: string;
};
