import React from 'react'
import type { Type as NextGamePanelType } from '../../globals/NextGameBanner'
import classes from './banner.module.scss'
import getConfig from 'next/config';
import Image from 'next/image';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat'
import Markdown from '../Markdown';

const { publicRuntimeConfig: { SERVER_URL } } = getConfig();

const NextGamePanel:React.FC<NextGamePanelType> = (props) => {
  dayjs.extend(localizedFormat)
  const {image} = props
  return <div className={classes.container} data-augmented-ui="tl-2-clip br-clip-x bl-clip border tr-clip tl-clip">
    <div className={classes.schedule}>
      <div className={classes.next}>Next Game Session:</div>
      <span><strong>Scheduled</strong> {props.scheduled !== undefined ? dayjs(props.scheduled).format('LLL') : 'TBA'}</span>
    </div>
      <h1>{props.title}</h1>
      <h2>{props.subtitle}</h2>
      <div className={classes.imgFrame} data-augmented-ui="tl-2-clip t-clip-x bl-2-clip-x br-2-clip-x border tl-clip tr-clip">
        {image && (
          <Image
            src={`${SERVER_URL}/media/${image.sizes?.banner?.filename || image.filename}`}
            alt={image.alt}
            width={1000}
            height={250}
            style={{display:'block'}}
            
          />
        )}</div>
    <div>
      <Markdown style={{fontSize:'0.75em'}}>{props.description}</Markdown>
    </div>
  </div>
}

export default NextGamePanel;