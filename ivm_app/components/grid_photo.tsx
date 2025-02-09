import React from 'react'
import Image from 'next/image'
import GridCell from './grid_cell';


interface GridPhotoProps {
  gridCell: [number, number, number, number];
  src: string;
  alt: string;
  loading?: "eager" | "lazy";
}


const GridPhoto: React.FC<GridPhotoProps> = ({ gridCell: gridArea, src, alt, loading }) => {
  const sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";
  const priority = loading === "eager"

  return (
    <GridCell gridArea={gridArea}>
      <Image
        src={src}
        alt={alt}
        fill={true}
        className="h-full w-full object-cover rounded-xl p-1"
        sizes={sizes}
        loading={"eager"}
        priority={priority}
      />
    </GridCell>
  )
}

export default GridPhoto