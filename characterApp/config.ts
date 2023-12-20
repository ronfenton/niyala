import { Attribute, CharacteristicSettings } from './types';
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
};
