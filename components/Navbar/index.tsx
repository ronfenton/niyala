import React from 'react'
import styles from './styles.module.scss'
import {default as FAIcon} from '../../components/FontAwesomeIcon'
import Link from 'next/link'
import { pureRandom } from '../../utilities/deckChatter'

export type Props = {
  statusCode: number
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

  const [waitingChats, setWaitingChats] = React.useState(['Open','More Open'] as string[])
  const [visibleChats, setVisibleChats] = React.useState(['x','y'])
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

  return <div className={responsive ? [styles.navContainer,styles.responsive].join(' ') : styles.navContainer}>
    {/* <div style={{gridArea:"a"}}>a</div>
    <div style={{gridArea:"e"}}>e</div>
    <div style={{gridArea:"f"}}>f</div>
    <div style={{gridArea:"b"}}>b</div>
    <div style={{gridArea:"c"}}>c</div>
    <div style={{gridArea:"d"}}>d</div> */}
    <div className={styles.brand}>Niyala</div>
    <div className={styles.navOptions}>{options.map(x => <Link key={x.path} className={x.disabled ? styles.disabled : ''} href={x.disabled ? '/' : x.path}>{x.text}</Link>)}</div>
    <div className={styles.expandToggle} onClick={() => setResponsive(!responsive)}><FAIcon icon="bars"/></div>
    <div className={styles.console}>
      <code>{visibleChats[0]}<br/>
      {visibleChats[1]}</code><br/>
      <code>@encrypted_user_24: _</code>
    </div>
    {/* <div className={responsive ? [styles.topnav,styles.responsive].join(' ') : styles.topnav}>
      <div className={styles.home}>World of Niyala</div>
      {options.map(x => <Link key={x.path} className={x.disabled ? styles.disabled : ''} href={x.disabled ? '/' : x.path}>{x.text}</Link>)}
      <div className={styles.icon} onClick={() => setResponsive(!responsive)}><FAIcon icon="bars"/></div>
    </div>
    <div className={styles.console}>
      <code>{visibleChats[0]}<br/>
      {visibleChats[1]}</code><br/>
      <code>@encrypted_user_24: _</code>
    </div> */}
  </div>
}

export default Navbar