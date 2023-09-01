import _ from "lodash/fp"
import type { CSEvent, CSListenerRecord } from "./types"

export const UpdateRegistry = (registry: CSListenerRecord[], listeners: CSListenerRecord[], funcID:string, listenerPath:string) => {
  const filtered = registry.reduce((acc,listener) => {
    if(listener.listenerPath !== listenerPath || listener.funcID !== funcID) {
      // listener unrelated to current update - ommission needed.
      return { newRegistry: [...acc.newRegistry, listener], remListeners: acc.remListeners }
    }
    if(listeners.includes(listener)) {
      return { newRegistry: [...acc.newRegistry, listener], remListeners: _.without([listener])(acc.remListeners) }
    }
    return acc
  },{newRegistry:[],remListeners:listeners} as {newRegistry:CSListenerRecord[],remListeners:CSListenerRecord[]})
  return [
    ...filtered.newRegistry,
    ...filtered.remListeners,
  ]
}

export const GetListenersForEvent = (registry: CSListenerRecord[], event: CSEvent) => {
  return registry.filter(x => x.eventName === event.name && (x.origin === undefined || x.origin === event.origin))
}
