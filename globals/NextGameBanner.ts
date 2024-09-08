import { GlobalConfig } from 'payload/types'

export type Type = {
  someVal: string
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
      name: 'Title',
      type: 'text',
      required: true,
      label: 'Session Name'
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
    {
      name: 'image',
      label: 'Featured Image',
      type: 'upload',
      relationTo: 'media',
    },
  ]
}

export default NextGameBanner