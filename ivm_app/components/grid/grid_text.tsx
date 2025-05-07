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
      <p className={"grid place-items-center h-full text-sm lg:text-lg xl:text-xl 2xl:text-2xl overflow-hidden p-1" + additionalClasses}>
        {children}
      </p>
    </GridCell>
  )
}

export default GridText