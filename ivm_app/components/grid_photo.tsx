import React from 'react'
import GridCell from './grid_cell';


interface GridPhotoProps {
  gridArea: [number, number, number, number];
  src: string;
  alt: string;
}


const GridPhoto: React.FC<GridPhotoProps> = ({ gridArea, src, alt }) => {
  return (
    <GridCell gridArea={gridArea}>
      <img src={src} alt={alt} className="h-full w-full object-cover rounded-xl" />
    </GridCell>
  )
}

export default GridPhoto