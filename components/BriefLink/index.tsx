import React from 'react'
import type { Type as BriefType } from '../../collections/Brief'
import Link from 'next/link'
import classes from './brieflink.module.scss'
import getConfig from 'next/config';
const { publicRuntimeConfig: { SERVER_URL } } = getConfig();

const BriefLink:React.FC<BriefType> = (props) => {
  const {slug,name} = props;

  return <Link href={`/brief/${slug}`}className={classes.linkBox} data-augmented-ui="border tl-clip-x br-clip-x">
      <span>{name}</span>
    </Link>
}

export default BriefLink;