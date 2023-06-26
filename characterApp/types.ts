export type CharacterState = {
  character: Character
  registry: any
}

export type Character = {
  id: string
  version: Version
  attributes: {
    [key:string]: Attribute
  }
  skills: {
    [key:string]: Skill
  }
  items: {
    [uuid:string]: InventoryItem
  }
}

export type Version = {
  current: string
  last: string
}

export type Characteristic = {
  name: string,
  library?: LibraryReference,
  description: string,
  tags: string[],
}

export type LibraryReference = {
  libraryId: string
  objectId: string
}

export type PermissionList = {
  ownerId: string
  gmId: string
  viewerIds: string[]
  editorIds: string[]
}

export type Identity = {
  nickname?: string
  fullName: string
  description: string
}

export type Levelled = {
  base: string
  lvlBase: number
  lvlPurchase: number
  lvlMod: number
  lvl: number
}

export type Attribute = Characteristic & Levelled & {
  abbreviation?: string
}

export type Skill = Characteristic & Levelled & {
  difficulty: number
}

export type InventoryItem = Characteristic & {
  qty: number
  wt: number
  val: number
}

export type Module = {
  name: string
  id: string
  attributes: {
    [uuid:string]: Attribute
  }
  skills: {
    [uuid:string]: Skill
  }
  templates: {  
    [uuid:string]: CharacterTemplate
    
  }
}

export type CharacterTemplate = {
  attributes: {
    [uuid:string]: { level: number, modifiers: [] }
  }
}

export type PrompterSettings = {
  title: string,
  description: string,
  permitCancel: boolean,
}

export interface Context {
  state: CharacterState
  logger: {
    debug: (x:string) => void,
    log: (x:string) => void,
    warn: (x: string) => void,
    error: (x: string) => void,
    fatal: (x: string) => void,
  },
  prompter: {
    bool: (context:PrompterSettings) => boolean,
    number: (context:PrompterSettings) => number,
    text: (context:PrompterSettings) => string,
    select: (context:PrompterSettings,options:string[],defaultSelect:string) => string,
  }
}