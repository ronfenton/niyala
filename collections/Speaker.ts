import { CollectionConfig } from 'payload/types';

const Speaker: CollectionConfig = {
  slug: 'speakers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'id'],
    group: 'Compendium',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      label: 'Handle',
      type: 'text',
      localized: false,
    },
    {
      name: 'image',
      label: 'Image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'relatedArticle',
      label: 'Profile Article',
      type: 'relationship',
      relationTo: 'articles',
    }
  ],
}

export default Speaker