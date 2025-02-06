import React from 'react'


interface GridPhotoProps {
  src: string;
  alt: string;
}


const GridPhoto: React.FC<GridPhotoProps> = ({ src, alt }) => {
  return (
    <img src={src} alt={alt} className="h-full w-full object-cover rounded-xl" />
  )
}

export default GridPhoto