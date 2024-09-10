import React from 'react'
import type { Type as NextGamePanelType } from '../../globals/NextGameBanner'
import classes from './banner.module.scss'
import getConfig from 'next/config';
import Image from 'next/image';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat'
import RichText from '../RichText';
import Markdown from '../Markdown';

const { publicRuntimeConfig: { SERVER_URL } } = getConfig();

const NextGamePanel:React.FC<NextGamePanelType> = (props) => {
  dayjs.extend(localizedFormat)
  const {image} = props
  return <div className={classes.container}>
    <div className={classes.schedule}>
      <div>Next Game Session.</div>
      <span><strong>Scheduled:</strong> {props.scheduled !== undefined ? dayjs(props.scheduled).format('LLL') : 'TBA'}</span>
    </div>
      <h1>{props.title}</h1>
      <h2>{props.subtitle}</h2>
    <sub></sub>
        {image && (
          <Image
            src={`${SERVER_URL}/media/${image.sizes?.banner?.filename || image.filename}`}
            alt={image.alt}
            style={{maxWidth:'100%',objectFit:'contain',height:'auto'}}
            width={1000}
            height={250}
          />
        )}
    <div>
      <Markdown style={{fontSize:'0.75em'}}>{props.description}</Markdown>
    </div>
  </div>
}

export default NextGamePanel;