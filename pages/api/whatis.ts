import payload from "payload"
import type {Type as DefinitionType} from '../../collections/Definition'



export const whatIs = async (searchTerm:string):Promise<DefinitionType> => {

  const results = await payload.find({
    collection: 'definitions',
    where: {
      or: [
        {
          term: {
            equals: searchTerm,
          }
        },
        {
          'otherTerms.term': {
            equals: searchTerm,
          }
        }
      ]
    },
  })

  if(results.docs.length === 0) {
    throw new Error(`Definition ${searchTerm} does not exist`)
  }
  console.log(results.docs[0].linkedArticle)
  const doc = {
    term: results.docs[0].term,
    otherTerms: results.docs[0].otherTerms.map(oTerm => oTerm.term),
    linkedArticle: `[${results.docs[0].linkedArticle.title}](https://niyala.net/compendium/${results.docs[0].linkedArticle.slug})`,
    content: results.docs[0].content,
  }
  return doc
}