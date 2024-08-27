import { CollectionConfig } from 'payload/types';
import { MediaType } from './Media';
import formatSlug from '../utilities/formatSlug';
import { Image } from '../blocks/Image/Config';
import { Type as ImageType } from '../blocks/Image/Component';
import { CallToAction } from '../blocks/CallToAction/Config';
import { Type as CallToActionType } from '../blocks/CallToAction/Component';
import { Content } from '../blocks/Content/Config';
import { Type as ContentType } from '../blocks/Content/Component';


export type Layout = CallToActionType | ContentType | ImageType

export type Type = {
  title: string
  slug: string
  image?: MediaType
  layout: Layout[]
  meta: {
    title?: string
    description?: string
    keywords?: string
  }
}

export const Post: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    group: 'Blog',
  },
  access: {
    read: (): boolean => true, // Everyone can read Pages
  },
  fields: [
    {
      name: 'title',
      label: 'Post  Title',
      type: 'text',
      required: true,
    },
    {
      name: 'layout',
      label: 'Page Layout',
      type: 'blocks',
      minRows: 1,
      blocks: [
        Content,
        Image,
      ],
    },
    {
      name: 'meta',
      label: 'Page Meta',
      type: 'group',
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
        },
        {
          name: 'keywords',
          label: 'Keywords',
          type: 'text',
        },
      ],
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      // allow selection of one or more categories
      hasMany: true,
    },
    {
      name: 'slug',
      label: 'Post Slug',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          formatSlug('title'),
        ],
      },
    },
  ],
};

export default Post;
