import { CollectionConfig } from 'payload/types';
import { MediaType } from './Media';
import type { Type as ArticleType } from './Article';

export type Type = {
  name: string,
  image: MediaType,
  relatedArticle: ArticleType,
}

const Speaker: CollectionConfig = {
  slug: 'speakers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'id'],
    group: 'Compendium',
    description: 'Speaker details for IC Comments.'
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
      maxDepth: 0,
    }
  ],
}

export default Speaker