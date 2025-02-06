import React from 'react'
import GridCell from './grid_cell';

interface GridGraphicProps {
  gridArea: [number, number, number, number];
  src: string;
  alt: string;
  zoomSrc?: string;
}

const GridGraphic: React.FC<GridGraphicProps> = ({ gridArea, src, alt, zoomSrc }) => {

  return (
    <GridCell gridArea={gridArea}>
      <img src={src} alt={alt} className="max-h-full max-w-full object-scale-down" />
    </GridCell>
  )

}

export default GridGraphic