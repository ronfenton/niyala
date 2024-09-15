import { Block } from 'payload/types';
import { markdownFieldGenerator } from '../MarkdownContent/payloadconfig';

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
        markdownFieldGenerator('content')
      ]
    }
  ],
};

export default Sidebar;