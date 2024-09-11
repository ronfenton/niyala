import React from 'react'
import styles from './styles.module.scss'
import {default as FAIcon} from '../../components/FontAwesomeIcon'
import Link from 'next/link'
import { pureRandom } from '../../utilities/deckChatter'
import Image from 'next/image'

export type Props = {
  statusCode: number
}

const NavLink:React.FC<{text:string,path:string,disabled?:boolean}> = (props) => {
  const {text,path,disabled} = props;
  return <Link 
    className={disabled !== true ? styles.cyberPunk : [styles.cyberPunk,styles.disabled].join(' ')}
    data-augmented-ui="border"
    href={disabled ? '/' : path}
    // className={disabled ? styles.disabled : ''}
    ><span>./{text}</span></Link>
}

const options: { text:string, path: string, icon?:string, disabled?: boolean}[] = [
  {
    text: 'home',
    path: '/',
  },
  {
    text: 'lore',
    path: '/compendium'
  },
  {
    text: 'game',
    path: '/brief'
  },
  {
    text: 'defs',
    path: '/definitions'
  },
  {
    text: 'vtt',
    path: '/foundry',
    disabled: true,
  },
  {
    text: 'sheet',
    path: '/character',
    disabled: true,
  }
]

const Navbar:React.FC<Props> = () => {

  const [waitingChats, setWaitingChats] = React.useState(pureRandom as string[])
  const [visibleChats, setVisibleChats] = React.useState([pureRandom[10],pureRandom[4]])
  const [responsive, setResponsive] = React.useState(false)

  const newMsg = () => {
    setVisibleChats([visibleChats[1],waitingChats[0]])
    if(waitingChats.length === 1) {
      setWaitingChats(pureRandom)
    } else {
      setWaitingChats(waitingChats.slice(1))
    }
  }

  React.useEffect(() => {
    const interval = setTimeout(() => {newMsg()},3000)
    return () => {clearInterval(interval)}
  },[visibleChats])

  return <div data-augmented-ui="border br-2-clip-x bl-2-clip-x" className={responsive ? [styles.navContainer,styles.responsive].join(' ') : styles.navContainer}>
    <Image width={400} height={100}src='/images/niyala.png' className={styles.brand} alt={''}/>
    <div className={styles.navOptions}>{options.map(x => <NavLink {...x} />)}</div>
    <div className={styles.expandToggle} onClick={() => setResponsive(!responsive)}><FAIcon icon="bars"/></div>
    <div className={styles.console}>
      <code>{visibleChats[0]}<br/>
      {visibleChats[1]}</code><br/>
      <code>@encrypted_user_24: _</code>
    </div>

  </div>
}

export default Navbar