import { CollectionConfig } from 'payload/types';


const Tag: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'id'],
    group: 'Blog',
    description: 'Tags for organising or searching blog posts, esp. for RSS feeds',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
    },
  ],
}

export default Tag