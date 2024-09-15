import { cloudStorage } from '@payloadcms/plugin-cloud-storage';
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3';
import { slateEditor } from '@payloadcms/richtext-slate';
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { buildConfig } from 'payload/config';
import { webpackBundler } from '@payloadcms/bundler-webpack'
import Media from './collections/Media';
import Article from './collections/Article';
import Brief from './collections/Brief';
import Category from './collections/Category';
import Definition from './collections/Definition';
import ICComment from './collections/ICComment';
import Post from './collections/Post';
import Speaker from './collections/Speaker';
import Tag from './collections/Tag';
import NextGameBanner from './globals/NextGameBanner';
import Page from './collections/Page';

export default buildConfig({
  admin: {
    bundler: webpackBundler()
  },
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  collections: [
    Page,
    Media,
    Post,
    Tag,
    Article,
    ICComment,
    Speaker,
    Brief,
    Definition,
    Category,
  ],
  db: mongooseAdapter({
    url: process.env.MONGODB_URI,
  }),
  editor: slateEditor({}),
  globals: [
    NextGameBanner
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
});