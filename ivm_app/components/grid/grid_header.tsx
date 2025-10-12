import React, { ReactNode } from 'react'
import GridCell from './grid_cell';

interface GridHeaderProps {
  gridCell: [number, number, number, number];
  children: ReactNode;
}

const GridHeader: React.FC<GridHeaderProps> = ({ gridCell: gridArea, children }) => {
  return (
    <GridCell gridArea={gridArea}>
      <h1 className={"text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl grid place-items-center h-full"}>
        {children}
      </h1>
    </GridCell >
  )
}

export default GridHeader