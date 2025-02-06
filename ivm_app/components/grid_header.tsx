import React, { ReactNode } from 'react'
import GridCell from './grid_cell';

interface GridHeaderProps {
  gridArea: [number, number, number, number];
  children: ReactNode;
}

const GridHeader: React.FC<GridHeaderProps> = ({ gridArea, children }) => {
  return (
    <GridCell gridArea={gridArea}>
      <h1 style={{ fontSize: "clamp(1rem, 5vw, 4rem)" }}>
        {children}
      </h1>
    </GridCell>

  )
}

export default GridHeader