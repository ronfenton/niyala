import _ from 'lodash/fp';
import type {
  CharacterState,
  Environment,
  CSEvent,
  CSAction,
  EventActionMap,
} from './types';
import { GetListenersForEvent } from './eventSystem';

/**
 * Completely wipes the registry, and iteratively recalculates every single item
 * on the character. This is an expensive operation, designed for urgent clean-up
 * operations, major version updates, error handling, or *initial* character
 * creation
 * @param c The character state to be reevaluated.
 */
const RecalculateAll = (s: CharacterState): CharacterState => s;

const eventProcessor2 = (
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
      const listeners = GetListenersForEvent(
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

  return eventProcessor2(
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
  return eventProcessor2(result.events, env, result.state, eventActionMap, 0);
};
