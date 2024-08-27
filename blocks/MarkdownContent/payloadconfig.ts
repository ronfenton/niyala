import { Field } from 'payload/types'
import Cell from './Cell'
import InputField from './InputField'

const markdownField: Field = {
  name: 'markdown',
  type: 'textarea',
  admin: {
    components: {
      Cell,
      Field:InputField,
    }
  }
}

export default markdownField