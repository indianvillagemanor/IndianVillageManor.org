import React, { useContext } from 'react'
import GridCell from './grid_cell';
import { WindowContext } from './window_context';
import { showModal } from './modal';

interface GridGraphicProps {
  gridCell: [number, number, number, number];
  src: string;
  alt: string;
  zoom?: boolean;
}

const GridGraphic: React.FC<GridGraphicProps> = ({ gridCell: gridArea, src, alt, zoom }) => {

  const { portrait, rowHeight } = useContext(WindowContext);

  const hClass = portrait ? "max-h-full" : "h-full";
  const hStyle = portrait ? { height: `${rowHeight * gridArea[2]}px` } : {}
  const onClick = zoom ? { onClick: () => showModal(src) } : {}

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