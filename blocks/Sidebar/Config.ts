import { Block, Field, TextField } from 'payload/types';
import Markdown from '../MarkdownContent/payloadconfig';

export const Sidebar: Block = {
  slug: 'sidebar',
  fields: [
    {
      name: 'header',
      label: 'header',
      type: 'text',
      required: false,
    },
    {
      name: 'image',
      label: 'Image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'caption',
      label: 'Image Caption',
      type: 'text',
      required: false,
    },
    {
      name: 'fields',
      type: 'array',
      fields: [
        {
          name: 'header',
          type: 'text',
        },
        // {
          // name: 'content',
          // type: 'textarea',
        // }
        {
         ...Markdown,
         name: 'content',
        } as TextField,
      ]
    }
  ],
};

export default Sidebar;