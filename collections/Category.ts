import { kebabCase } from 'lodash/fp';
import { CollectionConfig } from 'payload/types';

export type Type = {
  name: string,
  slug: string,
}

const Category: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'id'],
    group: 'Compendium',
    description: 'Gategories for organising or searching articles',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      localized: true,
      admin: {
        hidden: true,
      }
    },
  ],
  hooks: {
    beforeChange: [
      async (args) => {
        const doc = {
          ...args.data,
          slug: kebabCase(args.data.name)
        }
        args.context.slug = doc.slug
        return doc
      }
    ],
  }
}

export default Category