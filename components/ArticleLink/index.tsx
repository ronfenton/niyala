import React from 'react'
import type { Type as ArticleType } from '../../collections/Article'
import Link from 'next/link'
import Image from 'next/image';
import classes from './articlelink.module.scss'
import getConfig from 'next/config';
const { publicRuntimeConfig: { SERVER_URL } } = getConfig();

const ArticleLink:React.FC<ArticleType> = (props) => {
  const {slug,icon,name,backupImage} = props;

  const src = icon !== undefined
    ? `${SERVER_URL}/media/${icon.sizes?.icon?.filename || icon.filename}`
    : backupImage
      ? `/images/generic_${backupImage}.png`
      : '/images/generic_world.png'
  return <Link href={`/compendium/${slug}`} className={classes.linkBox} data-augmented-ui="border tl-clip-x br-clip-x">
      <span>{name}</span>
      <div data-augmented-ui="border"  className={classes.icon}><Image src={src} width={100} height={100} alt="" /></div>
    </Link>
}

export default ArticleLink;