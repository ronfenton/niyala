import { Block } from 'payload/types';
import Cell from './Cell'

export const MarkdownContent: Block = {
  slug: 'markdown',
  labels: {
    singular: 'Markdown Content',
    plural: 'Markdown Content Blocks',
  },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        components: {
          Cell: Cell,
        }
      }
    },
  ],
};

