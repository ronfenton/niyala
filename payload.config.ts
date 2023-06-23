import { buildConfig } from 'payload/config';
import dotenv from 'dotenv';
import path from 'path'
import Page from './collections/Page';
import Media from './collections/Media';
import Post from './collections/Post';
import Tag from './collections/Tag';
import Article from './collections/Article';
const createDiscordPath = path.resolve(__dirname, 'discord');
const createIOPath = path.resolve(__dirname, 'socketio');
const mockDiscordPath = path.resolve(__dirname, 'mocks/discord');
const mockIOPath = path.resolve(__dirname, 'mocks/socketio');

dotenv.config();

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  collections: [
    Page,
    Media,
    Post,
    Tag,
    Article,
  ],
  admin: {
    webpack: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          [createDiscordPath]:mockDiscordPath,
          [createIOPath]:mockIOPath, 
        }
      }
    })
  }
});
