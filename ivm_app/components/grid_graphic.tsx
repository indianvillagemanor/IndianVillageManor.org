import React from 'react'

interface GridGraphicProps {
  src: string;
  alt: string;
  zoomSrc?: string;
}

const GridGraphic: React.FC<GridGraphicProps> = ({ src, alt, zoomSrc }) => {

  return (
    <img src={src} alt={alt} className="max-h-full max-w-full object-scale-down" />
  )
}

export default GridGraphic