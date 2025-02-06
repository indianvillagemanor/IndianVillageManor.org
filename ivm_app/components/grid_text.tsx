import React, { ReactNode } from 'react'

const GridText = ({ children }: { children: ReactNode }) => {
  return (
    <p className="overflow-hidden">
      {children}
    </p>
  )
}

export default GridText