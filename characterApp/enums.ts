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
  PLUS,
  MINUS,
  FACTOR,
  DIVIDE,
}