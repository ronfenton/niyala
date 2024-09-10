require('dotenv').config();
const { sizes } = require('./blocks/Image/sizes.json');

module.exports = {
  publicRuntimeConfig: {
    SERVER_URL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  },
  images: {
    domains: [
      `192.168.1.120`,
      '127.0.0.1',
      'niyala.net',
      'https://niyala.net',
      'www.niyala.net',
      'https://www.niyala.net',
      // Your domain(s) here
    ],
    deviceSizes: sizes,
  },
};
