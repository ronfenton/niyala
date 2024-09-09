import React from 'react';
import payload from 'payload';
import { GetServerSideProps } from 'next';
import { Type as ArticleType } from '../../collections/Article';
import NotFound from '../../components/NotFound';
import Head from '../../components/Head';
import RenderBlocks from '../../components/RenderBlocks';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export type Props = {
  pages: ArticleType[]
  statusCode: number
}

const AllArticlesPage:React.FC<Props> = (props) => {
  const { pages } = props;

  if (!pages) {
    return <NotFound />;
  }

  return <div>
    <Head
        title='Niyala Compendium'
        description='A register of all Niyalan campaign setting information'
        keywords=''
      />
      <Navbar statusCode={200} />
      <div className="page-panel">
        <header>
          <h1>The Compendium</h1>
        </header>
        <ul>
        {pages.map(x => <li key={x.slug}><Link href={`/compendium/${x.slug}`}>{x.name}</Link></li>)}
        </ul>
      </div>
  </div>
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const postQuery = await payload.find({
    collection: 'articles',
    sort: 'name',
  });

  if (!postQuery.docs[0]) {
    ctx.res.statusCode = 404;

    return {
      props: {},
    };
  }

  return {
    props: {
      pages: postQuery.docs,
    },
  };
};

export default AllArticlesPage