import React from 'react'
import styles from './styles.module.scss'

export type Props = {
  statusCode: number
}

const Navbar:React.FC<Props> = (props) => {
  return <div className={styles.navbar}>
    <code>&gt; Idle processes maintained. Command input expected.<br/>
&gt; No new messages in secure channels.<br/>
&gt; Status update: No active threats. Monitoring for activity...<br/>
&gt; Secure backup completed. Awaiting further instructions.</code>
  </div>
}

export default Navbar