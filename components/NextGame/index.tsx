import React from 'react'
import type { Type as NextGamePanelType } from '../../globals/NextGameBanner'
import classes from '../css/page.module.scss';
import getConfig from 'next/config';

const { publicRuntimeConfig: { SERVER_URL } } = getConfig();

const NextGameBanner:React.FC<NextGamePanelType> = (props) => {
  const {image} = props
  return <div>
    <div className={classes.featuredImage}>
        {image && (
          <img
            src={`${SERVER_URL}/media/${image.sizes?.feature?.filename || image.filename}`}
            alt={image.alt}
          />
        )}
      </div>
  </div>
}

export default NextGameBanner;