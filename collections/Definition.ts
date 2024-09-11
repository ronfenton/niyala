import { CollectionBeforeChangeHook, CollectionConfig } from 'payload/types';
import Cell from '../blocks/MarkdownContent/Cell'
import InputField from '../blocks/MarkdownContent/InputField'
import { Type as MarkdownContentType } from '../blocks/MarkdownContent/Component'
import { kebabCase } from 'lodash';

export type Type = {
  name: string,
  slug: string,
  content: string,
  linkedArticle?: string,
  otherTerms?: {slug:string,name:string,id:string}[],
}

const createSearchTerm:CollectionBeforeChangeHook = (args) => {
  const patched = {
    ...args.data,
    slug: args.data.name.toLowerCase().trim(),
    otherTerms: args.data.otherTerms.map(x => { return {...x,slug:x.name.trim().toLowerCase()}})
  }
  return patched
}

const Definition: CollectionConfig = {
  slug: 'definitions',
  labels: {
    singular: 'Definition',
    plural: 'Definitions',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Campaign',
    description: 'Reference definitions for campaign terms.'
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      label: 'Term',
      type: 'text',
      localized: false,
    },
    {
      name: 'slug',
      type: 'text',
      localized: false,
      unique: true,
      admin: {
        hidden: true,
      }
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
          name: 'name',
          label: 'Term',
          type: 'text',
        },
        {
          name: 'slug',
          label: "Search Term",
          type: 'text',
          admin: {
            hidden: true,
          }
        }
      ]
    }
  ],
  hooks: {
    beforeChange: [
      async (args) => {
        const otherTerms = args.data.otherTerms.map(oldTerm => { return {...oldTerm,slug:kebabCase(oldTerm.name)}})
        const doc = {
          ...args.data,
          slug: kebabCase(args.data.name),
          otherTerms,
        }
        return doc
      }
    ],
  }
}

export default Definition