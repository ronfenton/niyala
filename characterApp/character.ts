import _ from 'lodash/fp';
import type {
  CharacterState,
  Environment,
  CSEvent,
  CSAction,
  EventActionMap,
  Characteristic,
  InsertOptions,
  Ruleset,
  CSEventAction,
  CSEventResponse,
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
export const insertObject = (charObject:Characteristic, charType: CharacteristicType, opts: InsertOptions): CSAction => (state: CharacterState, rs: Ruleset, env:Environment) => {
  const { character, registry } = state;
  const charSetting = rs.characteristics[charType]

  console.info(`Insert Object called`)

  // use key override or ruleset-defined key generation for object type.
  const key = opts.keyOverride || charSetting.functions.generateKey(charObject);
  if (character.characteristics[charType][key] === undefined) {
    const inserted = _.set(['character','characteristics',charType,key],charObject)(state)

    const postProcessed = charSetting.functions.create !== undefined 
      ? charSetting.functions.create(key,charObject)(inserted,rs,env)
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
      const inserted = _.set(['character','characteristics',charType,key],charObject)(state)
  
      const postProcessed = charSetting.functions.create !== undefined 
        ? charSetting.functions.create(key,charObject)(inserted,rs,env)
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
  state: CharacterState,
  rs: Ruleset,
  env: Environment,
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
          //const eventAction:CSEventAction = actionMap[listener.listeningCharType][
          const eventAction:CSEventResponse = rs.characteristics[listener.listeningCharType].eventResponses[
            listener.funcID
          ]
          const actionResult = eventAction(
            listener.listeningCharKey,
            event)(
            eventProcessedAccumulator.state,
            rs,
            env,
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
    allProcessedResult.state,
    rs,
    env,
    pass + 1,
  );
};

export const performAction = (
  action: CSAction,
  state: CharacterState,
  rs: Ruleset,
  env: Environment,
): CharacterState => {
  const result = action(state, rs, env);
  return eventProcessor(result.events, result.state, rs, env, 0);
};
