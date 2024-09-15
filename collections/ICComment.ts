import { CollectionConfig } from 'payload/types';
import { MarkdownContent } from '../blocks/MarkdownContent/Config';
import type { Type as MarkdownContentType } from '../blocks/MarkdownContent/Component';
import type { Type as SpeakerType } from './Speaker'
import type { Type as ArticleType } from './Article'
import type { Type as ImageType } from '../blocks/Image/Component';
import { Image } from '../blocks/Image/Config';

export type Layout = MarkdownContentType | ImageType

export type CommentType = {
  speaker: SpeakerType,
  deleted: boolean,
  content: Layout[],
}

export type Type = {
  article: ArticleType,
  comments: CommentType[]
}

const ICComment: CollectionConfig = {
  slug: 'iccomments',
  labels: {
    singular: 'IC Comment',
    plural: 'IC Comments',
  },
  admin: {
    useAsTitle: 'article',
    defaultColumns: ['article'],
    group: 'Compendium',
    description: 'In-Character commentary appended to Articles.'
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'article',
      type: 'relationship',
      relationTo: 'articles',
      required: true,
      unique: true,
      maxDepth: 0,
    },
    {
      name: 'comments',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'speaker',
          label: 'Speaker',
          type: 'relationship',
          relationTo: 'speakers',
        },
        {
          name: 'content',
          label: 'Content',
          type: 'blocks',
          blocks: [
            // MarkdownContent,
            // Image
          ],
        },
        {
          name: 'deleted',
          label: 'Deleted (cosmetic)',
          type: 'checkbox',
          defaultValue: false,
        }
      ]
    }
  ],
}

export default ICComment