import React, { ReactNode, useContext } from 'react'
import { WindowContext } from './window_context';

const GridSection = ({ rows, children }: { rows: number, children: ReactNode }) => {
  const { portrait, rowHeight } = useContext(WindowContext);
  const aspectColumns = portrait ? 1 : 3
  const gridStyle = (rows: number) => (
    {
      display: "grid",
      gridTemplateColumns: `repeat(${aspectColumns}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${rows}, ${rowHeight}px)`,
      gridGap: "2px",
      padding: "8px",
    }
  )

  const flowStyle = {
    display: "block",
    width: "100%",
    padding: "4px",
  }

  return (
    <div style={portrait ? flowStyle : gridStyle(27)}>
      {children}
    </div>
  )
}

export default GridSection