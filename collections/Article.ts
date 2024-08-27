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

export type TSection = {
  type: 'OOC' | 'IC',
  layout: Layout[]
}

export type Layout = ContentType | ImageType | SidebarType | MarkdownContentType

export type Type = {
  title: string
  slug: string
  hidden: boolean,
  sections: TSection[]
  meta: {
    title?: string
    description?: string
    keywords?: string
  }
}

export const Article: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    group: 'Compendium',
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
      name: 'hidden',
      label: 'Hidden',
      type: 'checkbox',
      defaultValue: false,
      required: true,
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Sections',
      minRows: 1,
      fields: [
        {
          name: 'type',
          label: 'Section Type',
          type: 'select',
          options: ['OOC','IC'],
          required: true,
          defaultValue: 'OOC',
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
        }
      ]
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
      unique: true,
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
  hooks: {
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
        if(Object.keys(args.previousDoc).length == 0) {
          channel.send(`*New Article:* **[${args.doc.title}](https://niyala.net/compendium/${args.doc.slug})**${description}`.trim())
          return;
        }
        channel.send(`*Updated Article:* **[${args.doc.title}](https://niyala.net/compendium/${args.doc.slug})**${description}`.trim())
        return args.doc
      }
    ]
  }
};

export default Article;
