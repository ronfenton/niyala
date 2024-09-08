import React from 'react';
import payload from 'payload';
import { GetServerSideProps } from 'next';
import getConfig from 'next/config';
import { Type as PageType } from '../collections/Page';
import { Type as DefinitionType } from '../collections/Definition';
import NotFound from '../components/NotFound';
import Head from '../components/Head';
import classes from '../css/page.module.scss';
import RenderBlocks from '../components/RenderBlocks';
import Navbar from '../components/Navbar';

const { publicRuntimeConfig: { SERVER_URL } } = getConfig();

export type Props = {
  page: PageType
  statusCode: number
  definitions: DefinitionType[]
}

const Page: React.FC<Props> = (props) => {
  const { page, definitions } = props;

  if (!page) {
    return (<NotFound />)
  }

  return (
    <div>
      <Head
        title={page.meta?.title || page.title}
        description={page.meta?.description}
        keywords={page.meta?.keywords}
      />
      <Navbar statusCode={200} />
      <div className="page-panel">
        <header className={classes.header}>
          <h1>{page.title}</h1>
        </header>
        <RenderBlocks layout={page.layout} />
        {
          definitions.map(x => <div key={x.slug}><em><strong>{x.name}</strong>{x.otherTerms.length > 0 ? ` (Also: ${x.otherTerms.map(y => y.name).join(', ')})` : ''}</em><br/><sup>{x.content}</sup></div>)
        }
      </div>
      <footer className={classes.footer}>

      </footer>
    </div>
  );
};

export default Page;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = 'definitions';

  const pageQuery = await payload.find({
    collection: 'pages',
    where: {
      slug: {
        equals: slug,
      },
    },
  });

  const definitionsQuery = await payload.find({
    collection: 'definitions',
    limit: 0,
    depth: 2,
  })

  return {
    props: {
      page: pageQuery.docs[0],
      definitions:  definitionsQuery.docs
    },
  };
};
