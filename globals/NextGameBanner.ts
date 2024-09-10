import { GlobalConfig } from 'payload/types'
import { MediaType } from '../collections/Media'
import getConfig from 'next/config';
import Cell from '../blocks/MarkdownContent/Cell';
import markdownField, { markdownFieldGenerator } from '../blocks/MarkdownContent/payloadconfig';

export type Type = {
  scheduled: Date,
  title: string,
  subtitle: string,
  image: MediaType,
  description: string,
}

const NextGameBanner: GlobalConfig = {
  slug: 'next-game',
  admin: {
    group: 'Campaign',
    description: 'Details on the next game session & scheduling',
  },
  label: 'Next Game Banner',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Session Name'
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle'
    },
    {
      name: 'scheduled',
      type: 'date',
      required: false,
      label: 'Next Game',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
          timeIntervals: 60,
        }
      }
    },
    markdownFieldGenerator('description'),
    {
      name: 'image',
      label: 'Featured Image',
      type: 'upload',
      relationTo: 'media',
    },
  ]
}

export default NextGameBanner