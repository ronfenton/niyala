import React from 'react';
import payload from 'payload';
import { GetServerSideProps } from 'next';
import getConfig from 'next/config';
import { Type as PageType } from '../collections/Page';
import { Type as ArticleType } from '../collections/Article';
import { Type as BriefType } from '../collections/Brief';
import { Type as NextGameBannerType } from '../globals/NextGameBanner';
import NotFound from '../components/NotFound';
import Head from '../components/Head';
import classes from '../css/page.module.scss';
import RenderBlocks from '../components/RenderBlocks';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import styles from '../css/rootpage.module.scss'
import NextGamePanel from '../components/NextGamePanel';
import ArticleLink from '../components/ArticleLink';
import BriefLink from '../components/BriefLink';

const { publicRuntimeConfig: { SERVER_URL } } = getConfig();

export type Props = {
  page?: PageType
  articles: ArticleType[],
  briefs: BriefType[],
  banner: NextGameBannerType,
  statusCode: number
}

const Page: React.FC<Props> = (props) => {
  const { page, articles, briefs, banner } = props;

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
      <div className="page-panel">
        <NextGamePanel {...banner}/>
        <RenderBlocks layout={page.layout} />
        <div className={styles.recentBlock} data-augmented-ui="tl-2-clip-x l-rect-y r-rect-y bl-2-clip-x tr-2-clip-x br-2-clip-x border">
          <div className={styles.recentDesc}>
            <h2>Campaign Briefs</h2>
            <p>Guides, campaign guidance, rules and mechanics for participation in the Niyalan Cyberpunk campaign - both those that relate to the gameplay, and the story.</p>
          </div>
          <div className={styles.recentList}>
            <div>Most Recent Campaign Briefs.</div>
            {briefs.map(x => <BriefLink {...x} />)}
          </div>
        </div>
        <div className={styles.recentBlock} data-augmented-ui="tl-2-clip-x l-rect-y r-rect-y bl-2-clip-x tr-2-clip-x br-2-clip-x border">
          <div className={styles.recentDesc}>
            <h2>The Compendium</h2>
            <p>A repository of articles covering the setting and world lore of Niyala, at the time of the Cyberpunk Campaign. Consider the pages a form of in-character wikipedia.</p>
          </div>
          <div className={styles.recentList}>
            <div>Most Recent Articles.</div>
            {articles.map(x => <ArticleLink {...x} />)}
          </div>
        </div>
      </div>
      <footer className={classes.footer}>

      </footer>
    </div>
  );
};

export default Page;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = 'home';

  const pageQuery = await payload.find({
    collection: 'pages',
    where: {
      slug: {
        equals: slug,
      },
    },
  });

  const nextGame = await payload.findGlobal({
    slug: 'next-game',
    depth: 5,
  })

  const articles = await payload.find({
    collection: 'articles',
    sort: '-updatedAt',
    limit: 5,
  })
  const briefs = await payload.find({
    collection: 'briefs',
    sort: '-updatedAt',
    limit: 5,
  })

  if (!pageQuery.docs[0]) {
    ctx.res.statusCode = 404;

    return {
      props: {},
    };
  }

  return {
    props: {
      page: pageQuery.docs[0],
      briefs: briefs.docs,
      articles: articles.docs,
      banner: nextGame,
    },
  };
};
