import { Block } from 'payload/types';
import { markdownFieldGenerator } from './payloadconfig';
// import Cell from './Cell'

export const MarkdownContent: Block = {
  slug: 'markdown',
  labels: {
    singular: 'Markdown Content',
    plural: 'Markdown Content Blocks',
  },
  fields: [
    markdownFieldGenerator('content'),
  ],
};

