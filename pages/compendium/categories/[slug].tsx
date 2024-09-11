import React from 'react';
import payload from 'payload';
import { GetServerSideProps } from 'next';
import { Type as ArticleType } from '../../../collections/Article';
import { Type as CategoryType } from '../../../collections/Category';
import NotFound from '../../../components/NotFound';
import Head from '../../../components/Head';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';
import classes from './categories.module.scss'
import Image from 'next/image';
import ArticleLink from '../../../components/ArticleLink';

export type Props = {
  articles: ArticleType[],
  category: CategoryType,
  statusCode: number
}

const ArticlePage:React.FC<Props> = (props) => {
  const { articles, category } = props;

  if (!category) {
    return <NotFound />;
  }

  return <div>
    <Head
        title={category.name}
        description={category.name + ' articles'}
      />
      <div className="page-panel">
        <header>
          <h1>Category: {category.name}</h1>
        </header>
        <div>
          {articles.map(x => <ArticleLink {...x}/>)}
        </div>
      </div>
  </div>
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = ctx.params?.slug

  const [category,articles] = await Promise.all([
    payload.find({
      collection: 'categories',
      where: {
        'slug': {
          equals: slug,
        }
      },
    }),
    payload.find({
      collection: 'articles',
      where: {
        'categories.category.slug': {
          contains: slug,
        }
      },
      sort: 'name',
    }),
  ])

  if (!category.docs[0]) {
    ctx.res.statusCode = 404;

    return {
      props: {},
    };
  }

  return {
    props: {
      category: category.docs[0],
      articles: articles.docs,
    },
  };
};

export default ArticlePage