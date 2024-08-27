
import type { Props as CellProps } from 'payload/components/views/Cell';
import React from 'react';
import './styles.scss';

const Cell: React.FC<CellProps> = (props) => {
  const {cellData } = props
  if (!cellData) return null
  return (
    <div style={{textOverflow:'ellipsis'}}>{cellData as string}</div>
  )
}

export default Cell