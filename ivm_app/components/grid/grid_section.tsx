import React, { ReactNode, useContext } from 'react'
import { WindowContext } from '../window_context';

interface GridSectionProps {
  rows: number;
  cols?: number;
  green?: boolean;
  id?: string;
  children: ReactNode;
}

const GridSection = ({ rows, cols, id, green, children }: GridSectionProps) => {
  const { portrait, rowHeight } = useContext(WindowContext);
  const gridStyle: React.CSSProperties =
  {
    display: "grid",
    gridTemplateColumns: `repeat(${cols || 3}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, ${rowHeight}px)`,
    gridGap: "4px",
    padding: "8px",
  }

  const flowStyle: React.CSSProperties =
  {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px",
  }

  const style = portrait ? flowStyle : gridStyle
  const cls = "scroll-offset" + (green ? " dark" : "")

  return (
    <div style={style} className={cls} id={id}>
      {children}
    </div>
  )
}

export default GridSection