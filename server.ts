import path from 'path';
import next from 'next';
import nextBuild from 'next/dist/build';
import express from 'express';
import payload from 'payload';
import { config as dotenv } from 'dotenv';
import { getGlobalDiscord } from './discord';
import { getGlobalIO } from './socketio'
import { getPayloadClient } from './payload';

dotenv();


const dev = process.env.NODE_ENV !== 'production';
const server = express();
const port = Number(process.env.PORT) || 3000

const start = async () => {
  await getGlobalDiscord()
  await getGlobalIO()

  const payload = await getPayloadClient({
    initOptions: {
      express: server,
      onInit: async newPayload => {
        newPayload.logger.info(`Payload Admin URL: ${newPayload.getAdminURL()}`)
      },
    },
  })
  if (process.env.NEXT_BUILD) {
    server.listen(port, async () => {
      payload.logger.info(`Next.js is now building...`)
      // @ts-expect-error
      await nextBuild(path.join(__dirname, '..'))
      process.exit()
    })

    return
  }

  const nextApp = next({
    dev: process.env.NODE_ENV !== 'production',
    port: port,
  })

  const nextHandler = nextApp.getRequestHandler()

  server.use((req, res) => nextHandler(req, res))

  nextApp.prepare().then(() => {
    payload.logger.info('Next.js started')

    server.listen(port, async () => {
      payload.logger.info(`Next.js App URL: ${process.env.PAYLOAD_PUBLIC_SERVER_URL}`)
    })
  })
  
  // await payload.init({
  //   secret: process.env.PAYLOAD_SECRET,
  //   express: server,
  // });

  // if (!process.env.NEXT_BUILD) {
  //   const nextApp = next({ dev });

  //   const nextHandler = nextApp.getRequestHandler();

  //   server.get('*', (req, res) => nextHandler(req, res));

  //   nextApp.prepare().then(() => {
  //     console.log('NextJS started');

  //     server.listen(process.env.PORT, async () => {
  //       console.log(`Server listening on ${process.env.PORT}...`);
  //     });
  //   });
  // } else {
  //   server.listen(process.env.PORT, async () => {
  //     console.log('NextJS is now building...');
  //     await nextBuild(path.join(__dirname, '../'), false, true, false, false, false, false, "default");
  //     process.exit();
  //   });
  // }
};

start();
