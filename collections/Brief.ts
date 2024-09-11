import { CollectionConfig } from 'payload/types';
import formatSlug from '../utilities/formatSlug';
import { Sidebar } from '../blocks/Sidebar/Config';
import { Type as SidebarType } from '../blocks/Sidebar/Component';
import { Image } from '../blocks/Image/Config';
import { Type as ImageType } from '../blocks/Image/Component';
import { Content } from '../blocks/Content/Config';
import { Type as ContentType } from '../blocks/Content/Component';
import { MarkdownContent } from '../blocks/MarkdownContent/Config';
import { Type as MarkdownContentType } from '../blocks/MarkdownContent/Component';
import { getGlobalDiscord } from '../discord';
import { TextChannel } from 'discord.js';
import { kebabCase } from 'lodash/fp';

export type TSection = {
  type: 'OOC' | 'IC',
  layout: Layout[]
}

export type Layout = ContentType | ImageType | SidebarType | MarkdownContentType

export type Type = {
  name: string
  slug: string
  layout: Layout[]
  meta: {
    title?: string
    description?: string
    keywords?: string
  }
}

export const Article: CollectionConfig = {
  slug: 'briefs',
  admin: {
    useAsTitle: 'title',
    group: 'Campaign',
    description: 'Documents related to the Campaign specifically.'
  },
  access: {
    read: (): boolean => true, // Everyone can read Pages
  },
  fields: [
    {
      name: 'name',
      label: 'Brief  Title',
      type: 'text',
      required: true,
    },
    {
      name: 'layout',
      label: 'Layout',
      type: 'blocks',
      blocks: [
        Content,
        Image,
        Sidebar,
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
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        hidden: true
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
    afterChange: [
      async (args) => {
        if (args.doc.hidden === true) {
          return args.doc;
        }
        const c = await getGlobalDiscord()
        const channel = c.channels.cache.get(process.env.DISCORD_NEWS_CHANNEL_ID) as TextChannel
        const description = args.doc.meta?.description 
          ? `\n> ${args.doc.meta.description}` 
          : ""
        if(args.operation === 'create') {
          channel.send(`*New Campaign Brief:* **[${args.doc.name}](https://niyala.net/brief/${args.context.slug})**${description}`.trim())
          return;
        }
        channel.send(`*Updated Campaign Brief:* **[${args.doc.name}](https://niyala.net/brief/${args.context.slug})**${description}`.trim())
        return;
      }
    ]
  }
};

export default Article;
