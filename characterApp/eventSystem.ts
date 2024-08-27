import _ from 'lodash/fp';
import type { CSEvent, CSListenerRecord, CSTriggerRecord } from './types';
import { triggerListToListeners } from './utility';
import * as enums from './enums';

export const updateRegistry = (registry: CSListenerRecord[], triggers: CSTriggerRecord[], funcID:string, listeningCharKey:string, listeningCharType: enums.CharacteristicType):CSListenerRecord[] => {
  const listeners = triggerListToListeners(triggers, funcID, listeningCharKey, listeningCharType);
  const filtered = registry.reduce((acc, listener) => {
    if (listener.listeningCharKey !== listeningCharKey || listener.funcID !== funcID) {
      // listener unrelated to current update - ommission needed.
      return { newRegistry: [...acc.newRegistry, listener], remListeners: acc.remListeners };
    }
    if (listeners.includes(listener)) {
      return { newRegistry: [...acc.newRegistry, listener], remListeners: _.without([listener])(acc.remListeners) };
    }
    return acc;
  }, { newRegistry: [], remListeners: listeners } as {newRegistry:CSListenerRecord[], remListeners:CSListenerRecord[]});
  return [
    ...filtered.newRegistry,
    ...filtered.remListeners,
  ];
};

export const getListenersForEvent = (registry: CSListenerRecord[], event: CSEvent):CSListenerRecord[] => registry.filter((x) => x.eventName === event.name && (x.origin === undefined || x.origin === event.origin));
