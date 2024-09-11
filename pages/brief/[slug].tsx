import React from 'react';
import payload from 'payload';
import { GetServerSideProps } from 'next';
import { Type as BriefType } from '../../collections/Brief';
import NotFound from '../../components/NotFound';
import Head from '../../components/Head';
import RenderBlocks from '../../components/RenderBlocks';
import Navbar from '../../components/Navbar';

export type Props = {
  page?: BriefType
  statusCode: number
}

const BriefPage:React.FC<Props> = (props) => {
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
      <div className="page-panel">
        <header>
          <h1>{page.name}</h1>
        </header>
        <RenderBlocks layout={page.layout} />
      </div>
  </div>
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = ctx.params?.slug ? ctx.params.slug : 'home';

  const postQuery = await payload.find({
    collection: 'briefs',
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

  return {
    props: {
      page: postQuery.docs[0],
    },
  };
};

export default BriefPage