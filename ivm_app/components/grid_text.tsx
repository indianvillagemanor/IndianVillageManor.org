import React, { ReactNode } from 'react'
import GridCell from './grid_cell';

interface GridTextProps {
  gridCell: [number, number, number, number];
  portrait: boolean;
  children: ReactNode;
}

const GridText: React.FC<GridTextProps> = ({ gridCell: gridArea, portrait, children }) => {
  return (
    <GridCell gridArea={gridArea} portrait={portrait}>
      <p className="overflow-hidden">
        {children}
      </p>
    </GridCell>
  )
}

export default GridText