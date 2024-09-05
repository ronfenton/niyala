import React from 'react';
import type { AppProps } from 'next/app';
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import '../css/style.scss';
import '../css/themes.scss';

const MyApp = ({ Component, pageProps }: AppProps): React.ReactElement => (
  <div className="themed retropunk">
    <Component {...pageProps} />
  </div>
);

export default MyApp;
