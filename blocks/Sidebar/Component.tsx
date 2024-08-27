import React from 'react';
import getConfig from 'next/config';
import { MediaType } from '../../collections/Media';
import classes from './index.module.css';
import Markdown from '../../components/Markdown';

const {
  publicRuntimeConfig: { SERVER_URL },
} = getConfig();

export type Type = {
  blockType: 'sidebar';
  blockName?: string;
  image?: MediaType;
  header?: string;
  caption?: string;
  fields: { header: string; content: string }[];
};

export const Component: React.FC<Type> = (props) => {
  const { image, header, caption, fields } = props;

  return (
    <div className={classes.sidebar}>
      <table style={{ border: '1px solid black' }}>
        <tbody>
          {(image || header || caption) && (
            <tr>
              <td colSpan={2} className={classes.sidebarHeader}>
                {header && <strong>{header}</strong>}
                {header && (image || caption) && <br />}
                {image && (
                  <img
                    src={`${SERVER_URL}/media/${
                      image.sizes?.feature?.filename || image.filename
                    }`}
                    alt={image.alt}
                  />
                )}
                {image && caption && <br />}
                {caption && <em>{caption}</em>}
              </td>
            </tr>
          )}
          {fields
            && fields.map(({ header: rowHeader, content }, i) => (
              <tr key={i}>
                <td>
                  <strong>{rowHeader}</strong>
                </td>
                <Markdown options={{wrapper:'td',forceWrapper:true}}>{content}</Markdown>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
