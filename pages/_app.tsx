import React from 'react';
import type { AppProps } from 'next/app';
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import '../css/style.css';

const MyApp = ({ Component, pageProps }: AppProps): React.ReactElement => (
  <Component {...pageProps} />
);

export default MyApp;
