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
  const onClick = onZoom ? { onClick: () => onZoom(src) } : {}

  const { portrait, rowHeight } = useContext(WindowContext);
  const [row, column, height, width] = gridArea;

  return (
    <GridCell gridArea={gridArea} fixedHeight={portrait}>
      {/* <GridCell gridArea={gridArea} fixedHeight={portrait ? (height * rowHeight) : undefined}> */}
      <img src={src} alt={alt}
        className="h-full max-w-full object-scale-down"
        style={{ display: "block", margin: "auto" }}
        {...onClick}
      />
    </GridCell>
  )

}

export default GridGraphic