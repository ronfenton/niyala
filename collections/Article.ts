import { ArrayField, BlockField, CheckboxField, CollectionConfig, SelectField } from 'payload/types';
import { Sidebar } from '../blocks/Sidebar/Config';
import { MediaType } from './Media';
import { Type as SidebarType } from '../blocks/Sidebar/Component';
import { Image } from '../blocks/Image/Config';
import { Type as ImageType } from '../blocks/Image/Component';
import { Content } from '../blocks/Content/Config';
import { Type as ContentType } from '../blocks/Content/Component';
import { MarkdownContent } from '../blocks/MarkdownContent/Config';
import { Type as MarkdownContentType } from '../blocks/MarkdownContent/Component';
import { Type as CategoryType } from './Category'
// import { getGlobalDiscord } from '../discord';
// import { TextChannel } from 'discord.js';
import { kebabCase } from 'lodash/fp';

export type TSection = {
  type: 'OOC' | 'IC',
  layout: Layout[]
}

export type Layout = ContentType | ImageType | SidebarType | MarkdownContentType

export type Type = {
  name: string
  slug: string
  icon?: MediaType
  backupImage: 'city' | 'landscape' | 'car' | 'gun' | 'woman' | 'man' | 'magic' | 'tech' | 'story' | 'world'
  hidden: boolean,
  sections: TSection[],
  categories: CategoryType[],
  meta: {
    title?: string
    description?: string
    keywords?: string
  }
}

export const Article: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'name',
    group: 'Compendium',
    description: 'General world documents, mixed IC/OOC.',
    defaultColumns: ['name','meta.description'],
  },
  access: {
    read: (): boolean => true, // Everyone can read Pages
  },
  fields: [
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      unique: true,
      admin: {
        hidden: true,
      }
    },
    {
      name: 'name',
      label: 'Article  Title',
      type: 'text',
      required: true,
    },
    {
      name: 'categories',
      type: 'array',
      fields: [{
        name: 'category',
        type: 'relationship',
        relationTo: 'categories',
      }]
    },
    {
      name: 'icon',
      label: 'Icon Image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'backupImage',
      type: 'select',
      options: ['city' , 'landscape' , 'car' , 'gun' , 'woman' , 'man' , 'magic' , 'tech' , 'story', 'world'],
      required: false
    },
    {
      name: 'hidden',
      label: 'Hidden',
      type: 'checkbox',
      defaultValue: false,
      required: true,
    } as CheckboxField,
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
        } as SelectField,
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
        } as BlockField
      ]
    } as ArrayField,
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
    // afterChange: [
    //   async (args) => {
    //     if (args.doc.hidden === true) {
    //       return args.doc;
    //     }
    //     const c = await getGlobalDiscord()
    //     const channel = c.channels.cache.get(process.env.DISCORD_NEWS_CHANNEL_ID) as TextChannel
    //     const description = args.doc.meta?.description 
    //       ? `\n> ${args.doc.meta.description}` 
    //       : ""
    //     if(args.operation === 'create') {
    //       channel.send(`*New Article:* **[${args.doc.name}](https://niyala.net/compendium/${args.context.slug})**${description}`.trim())
    //       return;
    //     }
    //     channel.send(`*Updated Article:* **[${args.doc.name}](https://niyala.net/compendium/${args.context.slug})**${description}`.trim())
    //     return;
    //   }
    // ]
  }
};

export default Article;
