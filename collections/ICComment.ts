import { CollectionConfig } from 'payload/types';
import { Content } from '../blocks/Content/Config';
import { Type as ContentType } from '../blocks/Content/Component'
import { Image } from '../blocks/Image/Config';
import { Type as ImageType } from '../blocks/Image/Component';

export type Layout = ContentType | ImageType

export type Type = {
  layout: Layout[],
  article: string,
  replyToComment?: string,
  deleted: boolean,
}

const ICComment: CollectionConfig = {
  slug: 'iccomments',
  labels: {
    singular: 'IC Comment',
    plural: 'IC Comments',
  },
  admin: {
    useAsTitle: 'speaker.name',
    defaultColumns: ['speaker.name', 'article.name', 'layout'],
    group: 'Compendium',
    description: 'In-Character commentary appended to Articles.'
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'layout',
      label: 'Content',
      type: 'blocks',
      blocks: [
        Content,
        Image,
      ]
    },
    {
      name: 'article',
      type: 'relationship',
      relationTo: 'articles',
      required: true,
    },
    {
      name: 'speaker',
      type: 'relationship',
      relationTo: 'speakers',
      required: true,
    },
    {
      name: 'replyToComment',
      type: 'relationship',
      relationTo: 'iccomments',
      required: false,
    },
    {
      name: 'deleted',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}

export default ICComment