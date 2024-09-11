import React from 'react';
import payload from 'payload';
import { GetServerSideProps } from 'next';
import { Type as ArticleType } from '../../collections/Article';
import { Type as CommentChain , CommentType} from '../../collections/ICComment';
import NotFound from '../../components/NotFound';
import Head from '../../components/Head';
import RenderBlocks from '../../components/RenderBlocks';
import Navbar from '../../components/Navbar';
import classes from './compendium.module.scss'
import Image from 'next/image';
import getConfig from 'next/config';

const { publicRuntimeConfig: { SERVER_URL } } = getConfig();

export type Props = {
  page?: ArticleType
  commentMap: CommentChain,
  statusCode: number
}

const Comment:React.FC<CommentType> = (props) => {
  const {speaker,content} = props

  return (
    <div className={classes.comment}>
      <Image
        src={speaker.image ? `${SERVER_URL}/media/${speaker.image?.sizes?.icon?.filename}` : '/images/niyala_logo_icon.png'}
        alt={speaker.image?.alt || 'Unrecognized Profile'}
        width={speaker.image ? 100 : 60}
        height={60}
      />
      
      <div className={classes.commentFrame}>
        <div className={classes.content}>
          <RenderBlocks layout={content} />
        </div>
        <div className={classes.signature}>
          {'>>'} {speaker.name}
        </div>
      </div>
    </div>
  )
}

const ArticlePage:React.FC<Props> = (props) => {
  const { page, commentMap } = props;

  if (!page) {
    return <NotFound />;
  }

  return <div>
    <Head
        title={page.meta?.title || page.name}
        description={page.meta?.description}
        keywords={page.meta?.keywords}
      />
      <Navbar statusCode={200} />
      <div className="page-panel">
        <header>
          <h1>{page.name}</h1>
        </header>
        <RenderBlocks layout={page.sections[0].layout} />
        <h2>Comments</h2>
        <div className={classes.commentField}>

          {
            commentMap.comments.length !== 0 
              ? commentMap.comments.map((x,i) => <Comment key={i} {...x} />)
              : undefined
          }
        </div>
      </div>
  </div>
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = ctx.params?.slug

  const postQuery = await payload.find({
    collection: 'articles',
    where: {
      slug: {
        equals: slug,
      },
    },
  });
  const commentsQuery = await payload.find({
    collection: 'iccomments',
    where: {
      'article.slug': {
        equals: slug
      }
    },
  })

  if (!postQuery.docs[0]) {
    ctx.res.statusCode = 404;

    return {
      props: {},
    };
  }

  return {
    props: {
      page: postQuery.docs[0],
      commentMap: commentsQuery.docs[0],
    },
  };
};

export default ArticlePage