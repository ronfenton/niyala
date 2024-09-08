import React from 'react'
import { TextInput, useFieldType } from 'payload/components/forms';
import Markdown from '../../../components/Markdown';
import { Button } from 'payload/components';

import { Label } from 'payload/components/forms';
import { Props } from 'payload/components/fields/Text';
import './styles.scss';

const InputField: React.FC<Props> = (props) => {
  const {path,label,required} = props
  const { value = '', setValue } = useFieldType({path})
  const [mdPreview,setMdPreview] = React.useState(false)
  return (
    <div className='field-type textarea'>
      <Label htmlFor={path} label={label} required={required}></Label> <Button buttonStyle='secondary'  onClick={() => setMdPreview(!mdPreview)}>{mdPreview ? 'Edit' : 'Preview'}</Button>
      {mdPreview 
        ? <Markdown options={{wrapper:'div'}} children={value as string}/>
        : <textarea className='field-type textarea-outer' value={value as string} onChange={(e) => setValue(e.target.value)}/>}
    </div>
  )
}

export default InputField