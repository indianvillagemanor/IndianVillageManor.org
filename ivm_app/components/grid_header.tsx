import React, { ReactNode } from 'react'
import GridCell from './grid_cell';

interface GridHeaderProps {
  gridCell: [number, number, number, number];
  portrait: boolean;
  children: ReactNode;
}

const GridHeader: React.FC<GridHeaderProps> = ({ gridCell: gridArea, portrait, children }) => {
  return (
    <GridCell gridArea={gridArea} portrait={portrait}>
      <h1 style={{ fontSize: "clamp(1rem, 5vw, 4rem)" }}>
        {children}
      </h1>
    </GridCell>

  )
}

export default GridHeader