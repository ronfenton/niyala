import _ from 'lodash/fp';
import type {
  CharacterState,
  Environment,
  CSEvent,
  CSAction,
  EventActionMap,
  Characteristic,
  InsertOptions,
} from './types';
import { getListenersForEvent } from './eventSystem';
import { CharacteristicType } from './enums';

/**
 * Completely wipes the registry, and iteratively recalculates every single item
 * on the character. This is an expensive operation, designed for urgent clean-up
 * operations, major version updates, error handling, or *initial* character
 * creation
 * @param c The character state to be reevaluated.
 */
const RecalculateAll = (s: CharacterState): CharacterState => s;

/**
 * New method of adding an object using generics. insertion logic is provided by the environment object's ruleset settings.
 * @param charObject 
 * @param charType 
 * @param opts 
 * @returns 
 */
export const insertObject = (charObject:Characteristic, charType: CharacteristicType, opts: InsertOptions): CSAction => (env:Environment, state:CharacterState) => {
  const { character, registry } = state;
  const charSetting = env.ruleset.characteristics[charType]

  // use key override or ruleset-defined key generation for object type.
  const key = opts.keyOverride || charSetting.functions.generateKey(charObject);
  if (character[charType][key] === undefined) {
    const inserted = _.set(['character',charType,key],charObject)(state)

    const postProcessed = charSetting.functions.create !== undefined 
      ? charSetting.functions.create(key,charObject)(env,inserted)
      : { state, events: [{
        name: charSetting.createEvent,
        origin: key,
      }] }
    return postProcessed
  }
  const method = opts.conflictMethod === 'prompt'
    ? env.prompter.select(
      {
        title: '',
        description: '',
        permitCancel: false,
      },
      [],
      'overwrite',
    )
    : opts.conflictMethod;

  switch(method) {
    case 'overwrite': {
      const inserted = _.set(['character',charType,key],charObject)(state)
  
      const postProcessed = charSetting.functions.create !== undefined 
        ? charSetting.functions.create(key,charObject)(env,inserted)
        : { state, events: [{
          name: charSetting.createEvent,
          origin: key,
        }] }
      return postProcessed
    }
    case 'ignore': {
      return { state: { character, registry }, events: [] };
    }
    case 'error': {
      throw new Error (`Duplicate key (${key}) when inserting ${charType}`)
    }
    default: {
      throw new Error (`Unhandled duplicate key (${key}) when inserting ${charType}`)
    }
  }
}

const eventProcessor = (
  events: CSEvent[],
  env: Environment,
  state: CharacterState,
  actionMap: EventActionMap,
  pass: number,
): CharacterState => {
  if (events.length === 0) {
    return state;
  }

  const allProcessedResult = events.reduce(
    (mainAccumulator, event, i) => {
      const listeners = getListenersForEvent(
        mainAccumulator.state.registry,
        event,
      );

      const eventProcessedResult = listeners.reduce(
        (eventProcessedAccumulator, listener) => {
          const actionResult = actionMap[listener.listeningCharType][
            listener.funcID
          ](
            env,
            eventProcessedAccumulator.state,
            listener.listeningCharKey,
            event.data,
          );
          return {
            state: actionResult.state,
            newEvents: [
              ...eventProcessedAccumulator.newEvents,
              ...actionResult.events,
            ],
          };
        },
        { state: mainAccumulator.state, newEvents: [] } as {
          state: CharacterState;
          newEvents: CSEvent[];
        },
      );
      return {
        state: eventProcessedResult.state,
        newEvents: [
          ...mainAccumulator.newEvents,
          ...eventProcessedResult.newEvents,
        ],
      };
    },
    {
      state,
      newEvents: [],
    } as { state: CharacterState; newEvents: CSEvent[] },
  );

  return eventProcessor(
    allProcessedResult.newEvents,
    env,
    allProcessedResult.state,
    actionMap,
    pass + 1,
  );
};

export const performAction = (
  env: Environment,
  state: CharacterState,
  action: CSAction,
  eventActionMap: EventActionMap,
): CharacterState => {
  const result = action(env, state);
  return eventProcessor(result.events, env, result.state, eventActionMap, 0);
};
