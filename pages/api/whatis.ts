import payload from "payload"
import type {Type as DefinitionType} from '../../collections/Definition'
import type {Type as ArticleType} from '../../collections/Article'
import { kebabCase } from 'lodash/fp';

export type WhatIsDefinition = {
  term: string,
  description: string,
  otherTerms?: string[],
  linkedArticle?: { url: string, title: string },
}

export const whatIs = async (searchTerm:string):Promise<WhatIsDefinition> => {

  const results = await payload.find({
    collection: 'definitions',
    where: {
      or: [
        {
          slug: {
            equals: kebabCase(searchTerm),
          }
        },
        {
          'otherTerms.slug': {
            equals: kebabCase(searchTerm),
          }
        }
      ]
    },
  })

  if(results.docs.length === 0) {
    throw new Error(`Definition ${searchTerm} does not exist`)
  }

  //@ts-ignore
  const definition = results.docs[0] as (DefinitionType & {linkedArticle?: ArticleType});

  const doc:WhatIsDefinition = {
    term: definition.name,
    description: definition.content,
    ...(definition.otherTerms.length != 0 ? {otherTerms: definition.otherTerms.map(x => x.name) } : {}),
    ...(definition.linkedArticle !== undefined 
        ? {linkedArticle:{url:`https://niyala.net/compendium/${definition.linkedArticle?.slug}`, title: definition.linkedArticle.name}}
        : {}
    )
  }
  return doc
}