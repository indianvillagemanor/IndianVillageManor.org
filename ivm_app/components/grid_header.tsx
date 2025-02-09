import React, { ReactNode, useContext } from 'react'
import GridCell from './grid_cell';
import { WindowContext } from './window_context';

interface GridHeaderProps {
  gridCell: [number, number, number, number];
  children: ReactNode;
}

const GridHeader: React.FC<GridHeaderProps> = ({ gridCell: gridArea, children }) => {
  const { portrait } = useContext(WindowContext);

  const fontSize = portrait ? "clamp(1rem, 7vw, 4rem)" : "clamp(1rem, 5vw, 6rem)";
  return (
    <GridCell gridArea={gridArea}>
      <h1 style={{ fontSize }}>
        {children}
      </h1>
    </GridCell>
  )
}

export default GridHeader