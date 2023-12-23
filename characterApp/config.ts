import { Attribute, CharacteristicSettings, Skill } from './types';
import * as enums from './enums';

export const characteristicSettings: CharacteristicSettings = {
  [enums.CharacteristicType.ATTRIBUTES]: {
    createEvent: enums.CSEventNames.ATTRIBUTE_CREATED,
    deleteEvent: enums.CSEventNames.ATTRIBUTE_DELETED,
    moddableValues: {
      lvl: {
        type: 'value',
        funcID: 'updateLevel',
        displayName: 'Level',
      },
    },
    selectableValues: {
      lvl: {
        type: 'moddableValue',
        changeEvent: enums.CSEventNames.ATTRIBUTE_LEVEL_CHANGED,
        stringFunc: (obj: Attribute):string => obj.abbreviation || obj.name,
      },
      name: {
        type: 'string',
        changeEvent: enums.CSEventNames.ATTRIBUTE_NAME_CHANGED,
        stringFunc: (obj: Attribute):string => obj.name,
      },
    },
  },
  [enums.CharacteristicType.SKILLS]: {
    createEvent: enums.CSEventNames.SKILL_CREATED,
    deleteEvent: enums.CSEventNames.SKILL_DELETED,
    moddableValues: {
      lvl: {
        type: 'value',
        funcID: 'updateLevel',
        displayName: 'Relative Level'
      },
      lvlSkill: {
        type: 'value',
        funcID: 'updateLevel',
        displayName: 'Skill Level',
      }
    },
    selectableValues: {
      lvl: {
        type: 'moddableValue',
        changeEvent: enums.CSEventNames.SKILL_LEVEL_CHANGED,
        stringFunc: (obj: Skill): string => obj.name
      },
      points: {
        type: 'moddableValue',
        changeEvent: enums.CSEventNames.SKILL_POINTS_CHANGED,
        stringFunc: (obj: Skill): string => `${obj.name} CP`
      },
    }
  }
};
