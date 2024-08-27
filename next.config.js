require('dotenv').config();
const { sizes } = require('./blocks/Image/sizes.json');

module.exports = {
  publicRuntimeConfig: {
    SERVER_URL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  },
  images: {
    domains: [
      'localhost',
      `192.168.1.120`,
      // Your domain(s) here
    ],
    deviceSizes: sizes,
  },
};
