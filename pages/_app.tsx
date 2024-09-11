import React from 'react';
import type { AppProps } from 'next/app';
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import '../css/style.scss';
import '../css/themes.scss';
import '../css/augmented-ui.min.css';
import Navbar from '../components/Navbar';
import FontAwesomeIcon from '../components/FontAwesomeIcon'

const MyApp = ({ Component, pageProps }: AppProps): React.ReactElement => (
  <div className="themed retropunk">
    <div className='deck'>
    <div className='deckScreen' data-augmented-ui="border t-scoop-x tl-round tr-round bl-round br-round b-clip-x">
      <div className='deckStatus'>
        <div className='deckDesign'>
          <FontAwesomeIcon icon='mcCamtech'/> CTECH-104A NAVIGATOR <span style={{color:'var(--col-negative)'}}>TAMPERING DETECTED</span>
        </div>
        <div className='deckConnection'>
          <span>19:40</span>
          <span>100%</span>
          <FontAwesomeIcon icon='battery'/>
          <FontAwesomeIcon icon='wifi'/>
        </div>
      </div>
      <Navbar statusCode={200}/>
      <div className='contentGroup'>
      <Component {...pageProps} />
      </div>
      </div>
    </div>
  </div>
);

export default MyApp;
