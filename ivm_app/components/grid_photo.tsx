import React from 'react'
import GridCell from './grid_cell';


interface GridPhotoProps {
  gridCell: [number, number, number, number];
  src: string;
  alt: string;
  portrait: boolean;
}


const GridPhoto: React.FC<GridPhotoProps> = ({ gridCell: gridArea, src, alt, portrait }) => {
  return (
    <GridCell gridArea={gridArea} portrait={portrait}>
      <img src={src} alt={alt} className="h-full w-full object-cover rounded-xl" />
    </GridCell>
  )
}

export default GridPhoto