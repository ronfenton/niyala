import React from 'react';
import ReactMarkdown, { MarkdownToJSX } from 'markdown-to-jsx';
import FontAwesomeIcon from '../../components/FontAwesomeIcon'

export type Type = {
  blockType: 'markdown';
  blockName?: string;
  content: string;
};

export const Component: React.FC<Type> = (props) => {
  const {content,...rest} = props
  //return <div>{JSON.stringify(props)}</div>
  return <ReactMarkdown options={
    {
      wrapper:React.Fragment,
      overrides: {
        FAI: {
          component: FontAwesomeIcon
        }
      }
    }
  } {...rest}>{content || '' as string}</ReactMarkdown>
}
