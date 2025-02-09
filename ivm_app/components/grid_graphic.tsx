import React, { useContext } from 'react'
import GridCell from './grid_cell';
import { WindowContext } from './window_context';

interface GridGraphicProps {
  gridCell: [number, number, number, number];
  src: string;
  alt: string;
  onZoom?: (src: string) => void;
}

const GridGraphic: React.FC<GridGraphicProps> = ({ gridCell: gridArea, src, alt, onZoom }) => {

  const { portrait, rowHeight } = useContext(WindowContext);

  const hClass = portrait ? "max-h-full" : "h-full";
  const hStyle = portrait ? { height: `${rowHeight * gridArea[2]}px` } : {}
  const onClick = onZoom ? { onClick: () => onZoom(src) } : {}

  return (
    <GridCell gridArea={gridArea}>
      <img src={src} alt={alt}
        className={hClass + " max-w-full object-scale-down"}
        style={hStyle}
        {...onClick}
      />
    </GridCell>
  )

}

export default GridGraphic