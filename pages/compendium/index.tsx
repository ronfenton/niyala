import React from 'react';
import payload from 'payload';
import { GetServerSideProps } from 'next';
import { Type as CategoryType } from '../../collections/Category';
import NotFound from '../../components/NotFound';
import Head from '../../components/Head';
import RenderBlocks from '../../components/RenderBlocks';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export type Props = {
  categories: CategoryType[]
  statusCode: number
}

const AllArticlesPage:React.FC<Props> = (props) => {
  const { categories } = props;

  if (!categories) {
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
        {categories.map(x => <li key={x.slug}><Link href={`/compendium/category/${x.slug}`}>{x.name}</Link></li>)}
        </ul>
      </div>
  </div>
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const postQuery = await payload.find({
    collection: 'categories',
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
      categories: postQuery.docs,
    },
  };
};

export default AllArticlesPage