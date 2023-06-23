import path from 'path';
import next from 'next';
import nextBuild from 'next/dist/build';
import express from 'express';
import payload from 'payload';
import { config as dotenv } from 'dotenv';
import { getGlobalDiscord } from './discord';



dotenv();


const dev = process.env.NODE_ENV !== 'production';
const server = express();

const start = async () => {
  await getGlobalDiscord()
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    mongoURL: process.env.MONGODB_URI,
    express: server,
  });

  if (!process.env.NEXT_BUILD) {
    const nextApp = next({ dev });

    const nextHandler = nextApp.getRequestHandler();

    server.get('*', (req, res) => nextHandler(req, res));

    nextApp.prepare().then(() => {
      console.log('NextJS started');

      server.listen(process.env.PORT, async () => {
        console.log(`Server listening on ${process.env.PORT}...`);
      });
    });
  } else {
    server.listen(process.env.PORT, async () => {
      console.log('NextJS is now building...');
      await nextBuild(path.join(__dirname, '../'), false, true, false, false, false, false, "default");
      process.exit();
    });
  }
};

start();
