import React from 'react'
// @ts-ignore
import {faMcCamtech, faMcTark, faMcTireppi, faMcPhoenix, faMcNeravue, faMcMoondale, faMcEverotech} from '@awesome.me/kit-b100d6751d/icons/kit/custom'
// @ts-ignore
import { byPrefixAndName } from '@awesome.me/kit-b100d6751d/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'

const iconMap = {
  mcCamtech: faMcCamtech as IconProp,
  mcTark: faMcTark as IconProp,
  mcTireppi: faMcTireppi as IconProp,
  mcPhoenix: faMcPhoenix as IconProp,
  mcNeravue: faMcNeravue as IconProp,
  mcMoondale: faMcMoondale as IconProp,
  mcEverotech: faMcEverotech as IconProp,
}

const Component:React.FC<{icon:string}> = (props) => {
  return <FontAwesomeIcon {...props} icon={iconMap[props.icon] || byPrefixAndName.fas[props.icon]} />
}

export default Component