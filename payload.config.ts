import { buildConfig } from 'payload/config';
import dotenv from 'dotenv';
import path from 'path'
import Page from './collections/Page';
import Media from './collections/Media';
import Post from './collections/Post';
import Tag from './collections/Tag';
import Article from './collections/Article';
const createDiscordPath = path.resolve(__dirname, 'discord');
const mockDiscordPath = path.resolve(__dirname, 'utilities/mockDiscord.ts');

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
        }
      }
    })
  }
});
