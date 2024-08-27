import React from 'react';
import ReactMarkdown, { MarkdownToJSX } from 'markdown-to-jsx';
import FontAwesomeIcon from '../../components/FontAwesomeIcon'

const Markdown: React.FC<{
  [key: string]: any;
  children: string;
  options?: MarkdownToJSX.Options;
}> = (props) => {
  const {children,options,...rest} = props
  return <ReactMarkdown options={{
    wrapper:React.Fragment,
    ...options,
    overrides: {
      FAI: {
        component: FontAwesomeIcon
      },
      ...(options.overrides || {})
    },
  }} {...rest}>{children as string}</ReactMarkdown>
}

export default Markdown