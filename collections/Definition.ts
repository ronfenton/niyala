import { CollectionConfig } from 'payload/types';
import Cell from '../blocks/MarkdownContent/Cell'
import InputField from '../blocks/MarkdownContent/InputField'
import { Type as MarkdownContentType } from '../blocks/MarkdownContent/Component'

export type Type = {
  term: string,
  content: string,
  linkedArticle?: string,
  otherTerms?: string[],
}

const Definition: CollectionConfig = {
  slug: 'definitions',
  labels: {
    singular: 'Definition',
    plural: 'Definitions',
  },
  admin: {
    useAsTitle: 'term',
    defaultColumns: ['term', 'linkedArticle'],
    group: 'Compendium',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'term',
      label: 'Term',
      type: 'text',
      localized: false,
    },
    {
      name: 'content',
      type: 'textarea',
      admin: {
        components: {
          Cell,
          Field:InputField,
        }
      }
    },
    {
      name: 'linkedArticle',
      type: 'relationship',
      relationTo: 'articles',
      required: false,
    },
    {
      name: 'otherTerms',
      type: 'array',
      fields: [
        {
          name: 'term',
          type: 'text',
        }
      ]
    }
  ],
}

export default Definition