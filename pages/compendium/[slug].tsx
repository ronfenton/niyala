import React from 'react';
import payload from 'payload';
import { GetServerSideProps } from 'next';
import { Type as ArticleType } from '../../collections/Article';
import NotFound from '../../components/NotFound';
import Head from '../../components/Head';
import RenderBlocks from '../../components/RenderBlocks';
import Navbar from '../../components/Navbar';

export type Props = {
  page?: ArticleType
  statusCode: number
}

const ArticlePage:React.FC<Props> = (props) => {
  const { page } = props;

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

  if (!postQuery.docs[0]) {
    ctx.res.statusCode = 404;

    return {
      props: {},
    };
  }
  console.log(JSON.stringify(postQuery.docs[0].category))

  return {
    props: {
      page: postQuery.docs[0],
    },
  };
};

export default ArticlePage