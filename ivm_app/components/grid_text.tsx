import React, { ReactNode } from 'react'
import GridCell from './grid_cell';

interface GridTextProps {
  gridArea: [number, number, number, number];
  children: ReactNode;
}

const GridText: React.FC<GridTextProps> = ({ gridArea, children }) => {
  return (
    <GridCell gridArea={gridArea}>
      <p className="overflow-hidden">
        {children}
      </p>
    </GridCell>
  )
}

export default GridText