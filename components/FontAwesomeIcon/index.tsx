import React from 'react'
import { faHouse } from '@awesome.me/kit-b100d6751d/icons/classic/solid'
import {faMcCamtech, faMcTark, faMcTireppi, faMcPhoenix, faMcNeravue, faMcMoondale, faMcEverotech} from '@awesome.me/kit-b100d6751d/icons/kit/custom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'

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
  return <FontAwesomeIcon {...props} icon={iconMap[props.icon]} />
}

export default Component