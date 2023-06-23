import { CollectionAfterChangeHook, CollectionConfig } from 'payload/types';
import { MediaType } from './Media';
import formatSlug from '../utilities/formatSlug';
import { Image } from '../blocks/Image/Config';
import { Type as ImageType } from '../blocks/Image/Component';
import { Type as CallToActionType } from '../blocks/CallToAction/Component';
import { Content } from '../blocks/Content/Config';
import { Type as ContentType } from '../blocks/Content/Component';
import { getGlobalDiscord, sendMessage } from '../discord';
import { TextChannel } from 'discord.js';
import axios from 'axios'


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

const updateHook = async ({originalDoc,previousDoc}) => {
  try {
    getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send(originalDoc.title + " Updated!"))
  } catch (e) {
    console.error(e)
  }
  return null
}

export const Article: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: (): boolean => true, // Everyone can read Pages
  },
  fields: [
    {
      name: 'title',
      label: 'Article  Title',
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
      name: 'slug',
      label: 'Article Slug',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          formatSlug('title'),
        ],
        afterChange: [
          (args) => getGlobalDiscord().then(c => (c.channels.cache.get('1120775031564275804') as TextChannel).send(`Article **[${args.originalDoc.title}](https://niyala.net/lexicon/${args.originalDoc.slug})** has been Updated!`))
        ]
      },
    },
  ],
};

export default Article;
