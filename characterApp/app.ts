import { CSAction, CharacterState, Environment, Prompter, PrompterSettings } from './types';
import { insertObject, performAction } from './character';
import { definition as attributeDef } from './attribute'
import * as enums from './enums'
import * as fixtures from './fixtures'

const someMockDB = {}

type testState = {
  lastEdit: Date;
  stringVal: string;
};

const states = new Map<string, testState>();

const saveToLocal = () => {
  // purely for debugging: 
  const randomChance = Math.random();
  if(randomChance > 0.9) {
    throw new Error('10% file IO fail emulation')
  }
  return
}

const saveToMongo = () => {
  const randomChance = Math.random();
  if(randomChance > 0.9) {
    throw new Error('10% file IO fail emulation')
  }
  return
}

const dbTimeoutFunc = () => {
  try {
    saveToMongo();
  } catch (e) {
    console.error(e.message)
  }
}

const ioTimeoutFunc = () => {
  try {
    saveToLocal();
  } catch (e) {
    console.error(e.message)
  }
}

const appState: {
  handlers: Set<((charID: string, data: {event:string, payload:any}) => void)>,
  characters: Map<string,{ state: CharacterState, lastEdit: Date}>,
  rulesets: Map<string, { ruleset: any, lastEdit: Date}>,
  lastFileBackup: Date,
  lastDBBackup: Date,
  debugLogger?: (x:string) => void,
  dbInterval:NodeJS.Timeout,
  ioInterval:NodeJS.Timeout,
} = {
  handlers: new Set<((charID: string, data: {event:string, payload:any}) => void)>(),
  characters: new Map<string,{ state: CharacterState, lastEdit: Date}>(),
  rulesets: new Map<string, { ruleset: any, lastEdit: Date}>(),
  lastFileBackup: new Date(),
  lastDBBackup: new Date(),
  debugLogger: (x) => console.debug(x),
  dbInterval: setInterval(dbTimeoutFunc,60000), 
  ioInterval: setInterval(ioTimeoutFunc,10000), 
} 

export const printDebug = () => {
  const {characters,lastFileBackup,lastDBBackup} = appState
  const mapped = [...characters.entries()].reduce( (acc, c) => ( 
    acc[c[0]] = c[1], 
    acc), {})
  console.log(JSON.stringify({
    characters: mapped,
    lastFileBackup, lastDBBackup
  }, null, 4))
  return `Debug sent to service console`
  //return JSON.stringify({
  //  characters: mapped,
  //  lastFileBackup, lastDBBackup
  //}, null, 4)
}



const servEnv:Environment = {
  logger: {
    debug: function (x: string): void {
      throw new Error('Function not implemented.');
    },
    log: function (x: string): void {
      throw new Error('Function not implemented.');
    },
    warn: function (x: string): void {
      throw new Error('Function not implemented.');
    },
    error: function (x: string): void {
      throw new Error('Function not implemented.');
    },
    fatal: function (x: string): void {
      throw new Error('Function not implemented.');
    }
  },
  prompter: {
    bool: function (context: PrompterSettings): boolean {
      throw new Error('Function not implemented.');
    },
    number: function (context: PrompterSettings): number {
      throw new Error('Function not implemented.');
    },
    text: function (context: PrompterSettings): string {
      throw new Error('Function not implemented.');
    },
    select: function (context: PrompterSettings, options: string[], defaultSelect: string): string {
      throw new Error('Function not implemented.');
    }
  },
}

/**
 * The primary action performance script for the Character Application.
 * @param charID Character ID to be manipulated.
 * @param userID User ID requesting to perform the action.
 * @param prompter Prompter to be provided by the calling interface to permit question/answers.
 * @param action Action to be performed on the character
 * @returns null
 */
export const handleAction = (charID: string, userID: string, prompter: Prompter, actionID: string, actionPayload: any):string => {
  try {
    if(actionID === 'create') {
      const newChar = fixtures.character({})
      appState.characters.set(charID,{state:{character:newChar, registry:[]},lastEdit: new Date()})
      appState.handlers.forEach((handler) => handler(charID, {event: 'Character Created', payload:{ id: charID }}))
      return `Character ${charID} created successfully`
    }
    const char = appState.characters.get(charID)
    const action = parseAction(actionID, actionPayload)
    // TODO: add some permission checks here.
    if(false) {
      appState.handlers.forEach(handler => handler(charID, {event: 'Disallowed Action', payload: {userID}}))
      return;
    }
    appState.debugLogger(`${charID}: ${action.str}`)
    const result = performAction(action.fn,char.state,{characteristics:{attributes:attributeDef}},{...servEnv,prompter})
    appState.characters.set(charID,{state:result,lastEdit: new Date()})
    appState.handlers.forEach((handler) => handler(charID, {event: 'State Change', payload: result}))
    return action.str + ': successful'
  } catch (e) {
    console.error(e.message)
    return `${actionID}: unsuccessful.\n\`${e.message}\``
  }
}

export const createCharacter = (id?:string) => {
  appState.characters.set(id || 'exampleval',{state:{character: fixtures.character({}),registry:[]},lastEdit: new Date()})
}

export const getByID = (charID: string) => {console.log(appState.characters); console.log(appState.characters.get(charID)); return appState.characters.get(charID)}

const parseAction = (actionID: string, data: any): { fn: CSAction, str: string } => {
  console.info(
    `%cReq Received.\nAct. ID %c${actionID}%c` + Object.entries(data).map(([k,v]) => `\n-${k} (${typeof v}):${v}`).join() + `\n${JSON.stringify(data)}`,
    `color: cyan;`,
    `color: yellow; font-weight: bold;`,
    `color: cyan;`
  )
  switch (actionID) {
    case 'insert-attribute': return {fn: insertObject(fixtures.attribute(data), enums.CharacteristicType.ATTRIBUTES,{}), str: `Insert simple attribute ${data.name}`};
    //case 'insert-attribute': return {fn: (c,r,e) => { return { state: {...c,someVal:'HI!'},events:[]}},str:'tested'}
    //case 'skill.insert': return {fn: SkillFuncs.insert(data.skill,data.opts), str: `Insert skill ${data.skill.name}`}
    default: throw new Error('Unhandled Action')
  }
}

export const subscribeHandler = (handler: (charID: string, data: any) => void) => {
  appState.handlers.add(handler)
}

const v = {
  fn: {
    
  }
}