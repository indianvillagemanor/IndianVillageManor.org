import React, { ReactNode } from 'react'

const GridHeader = ({ children }: { children: ReactNode }) => {
  return (
    <h1 style={{
      fontSize: "clamp(1rem, 5vw, 4rem)"
    }}>
      {children}
    </h1>

  )
}

export default GridHeader