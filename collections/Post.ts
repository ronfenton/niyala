import { CollectionConfig } from 'payload/types';
import { MediaType } from './Media';
import formatSlug from '../utilities/formatSlug';
import { Image } from '../blocks/Image/Config';
import { Type as ImageType } from '../blocks/Image/Component';
import { CallToAction } from '../blocks/CallToAction/Config';
import { Type as CallToActionType } from '../blocks/CallToAction/Component';
import { Content } from '../blocks/Content/Config';
import { Type as ContentType } from '../blocks/Content/Component';
import { MarkdownContent } from '../blocks/MarkdownContent/Config';
import { kebabCase } from 'lodash/fp';


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
    useAsTitle: 'name',
    group: 'Blog',
    description: 'Blog posts for development',
  },
  access: {
    read: (): boolean => true, // Everyone can read Pages
  },
  fields: [
    {
      name: 'name',
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
        MarkdownContent,
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
      hidden: true,
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
};

export default Post;
