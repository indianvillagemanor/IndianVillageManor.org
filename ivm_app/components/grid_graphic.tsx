import React, { useContext } from 'react';
import Image from 'next/image';
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

  const { portrait } = useContext(WindowContext);

  return (
    <GridCell gridArea={gridArea} fixedHeight={portrait}>
      <Image src={src} alt={alt}
        className="h-full max-w-full object-scale-down"
        fill
        style={{ display: "block", margin: "auto" }}
        {...onClick}
      />
    </GridCell>
  )

}

export default GridGraphic