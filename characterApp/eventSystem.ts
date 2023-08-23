import _ from "lodash/fp"
import type { CSListenerMap, Characteristic, SubscribedCSEventsMap } from "./types"
import { BaseResponse, withoutEmptyArray, withoutEmptyObject, type CSListener } from "./utility"


const GetListenedEventsFromMap = (map: CSListenerMap): CSListener[] => {
  return Object.entries(map).reduce((acc, [eventName, origins]) => [
    ...acc,
    ...Object.keys(origins).reduce((acc2, origin) => [...acc2, { eventName, objectPath: origin }], [] as CSListener[])
  ], [] as CSListener[])
}

const GetListenerChanges = (before: Characteristic, after: Characteristic): { add: CSListener[], rem: CSListener[] } => {
  const aList = GetListenedEventsFromMap(before.subscribedEvents || {})
  const bList = GetListenedEventsFromMap(after.subscribedEvents || {})
  const rem = aList.reduce((rList, l) => bList.includes(l) ? rList : [...rList, l], [] as CSListener[])
  const add = bList.reduce((aList, l) => aList.includes(l) ? aList : [...aList, l], [] as CSListener[])
  return { rem, add }
}

const UpdateRegistry = (registry: CSListenerMap, path: string, addListeners: CSListener[], remListeners: CSListener[]): CSListenerMap => {
  const addedRegistry = addListeners.reduce((acc, listener) => {
    const { eventName, objectPath = "__all" } = listener
    return {
      ...acc,
      [eventName]: {
        ...(acc[eventName] || {}),
        [objectPath]:
          (
            acc[eventName] != undefined && acc[eventName][objectPath] != undefined
              ? [...acc[eventName][objectPath], path]
              : [path]
          )
      }
    }
  }, registry)
  return remListeners.reduce((acc, listener) => {
    const { eventName, objectPath = "__all" } = listener
    return {
      ...acc,
      [eventName]: {
        ...(acc[eventName] || {}),
        [objectPath]:
          (
            _.without([path])(acc[eventName][objectPath])
          )
      }
    }
  }, addedRegistry)
}

const UpdateCharacteristicRegistry = (registry: CSListenerMap, path: string, before: Characteristic, after: Characteristic) => {
  const changes = GetListenerChanges(before, after)
  return UpdateRegistry(registry, path, changes.add, changes.rem)
}


export const UpdateObjectListeners = (obj:Characteristic,funcID:string,resp:BaseResponse):Characteristic => {
  const {subscribedEvents,...rem} = obj
    if(resp.listeners.length === 0 && (subscribedEvents === undefined || Object.keys(subscribedEvents).length === 0)) {
        return rem
    }
    if(subscribedEvents === undefined) {
      return {
        ...rem,
        subscribedEvents: AddSubscriptions(subscribedEvents,resp,funcID)
      }
    }
    if(resp.listeners.length === 0) {
      return {
        ...rem,
        ...withoutEmptyObject(RemSubscriptions(subscribedEvents,funcID),'subscribedEvents')
      }
    }
    return {
      ...rem,
      subscribedEvents: AddSubscriptions(RemSubscriptions(subscribedEvents,funcID),resp,funcID)
    }
}

export const AddSubscriptions = (obj:SubscribedCSEventsMap,r:BaseResponse,funcId: string) => {
    return r.listeners.reduce((acc,listener) => {
        return {
            ...acc,
            [listener.eventName]: {
                ...acc[listener.eventName] || {},
                [listener.objectPath || "__all"]: _.uniq([
                    ...obj[listener.eventName] != undefined ? obj[listener.eventName][listener.objectPath] || [] : [],
                    funcId
                ])
            }
        }
    },obj || {} as SubscribedCSEventsMap)
}

export const RemSubscriptions = (obj:SubscribedCSEventsMap, funcID: string) => {
    return Object.entries(obj || {}).reduce((acc,[eventName,eventListenerMap]) => {
        return {
            ...acc,
            ...withoutEmptyObject(Object.entries(eventListenerMap).reduce((mapAcc,[origin,funcs]) => {
              return {
                  ...mapAcc,
                  ...withoutEmptyArray(funcs.filter(x => x != funcID),origin)
              }
          },{}), eventName)
        }
    },{})
}