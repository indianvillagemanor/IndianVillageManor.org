import React, { ReactNode } from 'react'
import GridCell from './grid_cell';

interface GridTextProps {
  gridCell: [number, number, number, number];
  className?: string;
  children: ReactNode;
}

const GridText: React.FC<GridTextProps> = ({ gridCell: gridArea, className, children }) => {
  const additionalClasses = className ? (" " + className) : "";
  return (
    <GridCell gridArea={gridArea}>
      <p className={"grid place-items-center h-full text-sm md:text-md lg:text-lg xl:text-lg overflow-hidden p-1" + additionalClasses}>
        {children}
      </p>
    </GridCell>
  )
}

export default GridText