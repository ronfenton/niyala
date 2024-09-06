import { buildConfig } from 'payload/config';
import dotenv from 'dotenv';
import path from 'path'
import Page from './collections/Page';
import Media from './collections/Media';
import Post from './collections/Post';
import Tag from './collections/Tag';
import Article from './collections/Article';
import Definition from './collections/Definition';
import { cloudStorage } from '@payloadcms/plugin-cloud-storage';
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3';
import ICComment from './collections/ICComment';
import Speaker from './collections/Speaker';
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
    ICComment,
    Speaker,
    Definition,
  ],
  plugins: [
    // Pass the plugin to Payload
    cloudStorage({
      collections: {
        // Enable cloud storage for Media collection
        media: {
          prefix:'media',
          // Create the S3 adapter
          adapter: s3Adapter({
            config: {
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
              },
              region: process.env.S3_REGION,
              // ... Other S3 configuration
            },
            bucket: process.env.S3_BUCKET,
          }),
        },
      },
    }),
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
