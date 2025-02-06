import React from 'react'
import GridCell from './grid_cell';

interface GridGraphicProps {
  gridCell: [number, number, number, number];
  src: string;
  alt: string;
  zoomSrc?: string;
  portrait: boolean;
}

const GridGraphic: React.FC<GridGraphicProps> = ({ gridCell: gridArea, src, alt, portrait, zoomSrc }) => {

  return (
    <GridCell gridArea={gridArea} portrait={portrait}>
      <img src={src} alt={alt} className="max-h-full max-w-full object-scale-down" />
    </GridCell>
  )

}

export default GridGraphic