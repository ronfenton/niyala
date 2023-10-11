export enum CharacterPermissionRole {
  UNKNOWN,
  OWNER,
  GM,
  EDITOR,
  VIEWER,
  ALLY,
}

export enum CSEventNames {
  ATTRIBUTE_CREATED = "AttributeCreated",
  ATTRIBUTE_LEVEL_CHANGED = "AttributeLevelChanged",
  ATTRIBUTE_DELETED = "AttributeDeleted",
  MODIFIER_CREATED = "ModifierCreated",
  MODIFIER_DELETED = "ModifierDeleted",
  MODIFIER_EFFECT_CHANGED = "ModifierEffectChanged",
  MODIFIER_SUBJECTS_CHANGED = "ModifierSubjectsChanged",
  MODIFIER_ENABLED = "ModifierEnabled",
  MODIFIER_DISABLED = "ModifierDisabled",
  MODIFIER_FILTER_CHANGED = "ModifierFilterChanged",
}

export enum CostModType {
  UNKNOWN,
  FLAT,
  MULTIPLIER,
  COSTFACTOR,
}

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

export enum Operands {
  PLUS = "+",
  MINUS = "-",
  FACTOR = "x",
  DIVIDE = "/",
  DIVIDEFLOOR = "/v",
  DIVIDECIEL = "/^",
}

export enum ValueComparitors {
  GREATER = ">",
  GREATER_OR_EQUAL = ">=",
  LESS = "<",
  LESS_OR_EQUAL = "<=",
  EQUAL = "==",
  NOT_EQUAL = "!=",
}

export enum StringComparitors {
  IS = "==",
  REGEX = "reg",
  INCLUDES = "inc",
}

export enum LogicalOperators {
  AND = "AND",
  OR = "OR",
  NOR = "NOR",
  XOR = "XOR",
}