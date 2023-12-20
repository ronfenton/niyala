export enum CharacterPermissionRole {
  UNKNOWN,
  OWNER,
  GM,
  EDITOR,
  VIEWER,
  ALLY,
}

export enum CSEventNames {
  ATTRIBUTE_CREATED = 'AttributeCreated',
  ATTRIBUTE_NAME_CHANGED = 'AttributeNameChanged',
  ATTRIBUTE_LEVEL_CHANGED = 'AttributeLevelChanged',
  ATTRIBUTE_DELETED = 'AttributeDeleted',
  MODIFIER_CREATED = 'ModifierCreated',
  MODIFIER_DELETED = 'ModifierDeleted',
  MODIFIER_EFFECT_CHANGED = 'ModifierEffectChanged',
  MODIFIER_SUBJECTS_CHANGED = 'ModifierSubjectsChanged',
  MODIFIER_ENABLED = 'ModifierEnabled',
  MODIFIER_DISABLED = 'ModifierDisabled',
  MODIFIER_FILTER_CHANGED = 'ModifierFilterChanged',
}

export enum CostModType {
  UNKNOWN,
  FLAT,
  MULTIPLIER,
  COSTFACTOR,
}

export enum DerivedValueType {
  UNKNOWN = 'Unknown',
  VALUE = 'Value',
  BRACKET = 'Arithmetic',
  TRIG = 'Trig',
  AGGREGATE = 'Aggregate',
  ROUND = 'Round',
  EXPONENT = 'Exponent',
  CHARACTERISTIC = 'CharacteristicValue',
}

export enum DerivedStringType {
  UNKNOWN = 'Unknown',
  STRING = 'String',
  CHARACTERISTIC = 'CharacteristicString',
}

export enum ValueOperands {
  PLUS = '+',
  MINUS = '-',
  FACTOR = 'x',
  DIVIDE = '/',
}

export enum ValueComparitors {
  GREATER = '>',
  GREATER_OR_EQUAL = '>=',
  LESS = '<',
  LESS_OR_EQUAL = '<=',
  EQUAL = '==',
  NOT_EQUAL = '!=',
}

export enum StringComparitors {
  IS = '==',
  REGEX = 'reg',
  INCLUDES = 'inc',
}

export enum StringOperands {
  APPEND = 'app',
  PREPEND = 'pre',
  SET = 'set',
  REPLACE = 'rep',
}

export enum LogicalOperators {
  AND = 'AND',
  OR = 'OR',
  NOR = 'NOR',
}

export enum CharacteristicType {
  TESTING = 'testing',
  ATTRIBUTES = 'attributes',
  OBJECT_MODIFIERS = 'objectMods',
}

export enum ModifierEffectType {
  VALUE = 'value',
  STRING = 'string',
  ARRAY = 'array',
  BOOLEAN = 'boolean',
  FLAG = 'flag',
}
