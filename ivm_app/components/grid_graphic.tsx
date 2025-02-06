import React, { useContext } from 'react'
import GridCell from './grid_cell';
import { WindowContext } from './window_context';

interface GridGraphicProps {
  gridCell: [number, number, number, number];
  src: string;
  alt: string;
  zoomSrc?: string;
}

const GridGraphic: React.FC<GridGraphicProps> = ({ gridCell: gridArea, src, alt, zoomSrc }) => {

  const { portrait, rowHeight } = useContext(WindowContext);

  const hClass = portrait ? "max-h-full" : "h-full";
  const hStyle = portrait ? { height: `${rowHeight * gridArea[2]}px` } : {}

  return (
    <GridCell gridArea={gridArea}>
      <img src={src} alt={alt}
        className={hClass + " max-w-full object-scale-down"}
        style={hStyle}
      />
    </GridCell>
  )

}

export default GridGraphic