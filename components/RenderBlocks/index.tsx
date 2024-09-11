import React from 'react';
import { Layout as PageLayout } from '../../collections/Page';
import { Layout as ArticleLayout } from '../../collections/Article';
import { Layout as CommentLayout } from '../../collections/ICComment';
import { components } from '../../blocks';
import classes from './index.module.css';

type Props = {
  layout: (PageLayout | ArticleLayout | CommentLayout)[]
  className?: string
}

const RenderBlocks: React.FC<Props> = ({ layout, className }) => (
  <div className={[
    classes.renderBlocks,
    className,
  ].filter(Boolean).join(' ')}
  >
    {layout.map((block, i) => {
      const Block: React.FC<any> = components[block.blockType];

      if (Block) {
        return (
          <section
            key={i}
            className={classes.block}
          >
            <Block {...block} />
          </section>
        );
      }

      return null;
    })}
  </div>
);

export default RenderBlocks;
