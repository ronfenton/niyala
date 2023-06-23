import { CollectionAfterChangeHook, CollectionConfig } from 'payload/types';
import { MediaType } from './Media';
import formatSlug from '../utilities/formatSlug';
import { Image } from '../blocks/Image/Config';
import { Type as ImageType } from '../blocks/Image/Component';
import { Type as CallToActionType } from '../blocks/CallToAction/Component';
import { Content } from '../blocks/Content/Config';
import { Type as ContentType } from '../blocks/Content/Component';
import { getGlobalDiscord } from '../discord';
import { TextChannel } from 'discord.js';


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
          async (args) => {
            const c = await getGlobalDiscord()
            const channel = c.channels.cache.get('1120775031564275804') as TextChannel
            const description = args.originalDoc.meta?.description 
              ? `\n> ${args.originalDoc.meta.description}` 
              : ""
            if(Object.keys(args.previousDoc).length == 0) {
              channel.send(`*New Article:* ***${args.originalDoc.title}*** https://niyala.net/compendium/${args.originalDoc.slug}${description}`.trim())
              return;
            }
            channel.send(`*Updated Article:* ***${args.originalDoc.title}*** https://niyala.net/compendium/${args.originalDoc.slug}${description}`.trim())
          }
        ]
      },
    },
  ],
};

export default Article;
