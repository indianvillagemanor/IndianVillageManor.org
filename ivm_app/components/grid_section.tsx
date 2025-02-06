import React, { ReactNode, useContext } from 'react'
import { WindowContext } from './window_context';

interface GridSectionProps {
  rows: number;
  green?: boolean;
  id?: string;
  children: ReactNode;
}

const GridSection = ({ rows, id, green, children }: GridSectionProps) => {
  const { portrait, rowHeight } = useContext(WindowContext);
  const aspectColumns = portrait ? 1 : 3
  const gridStyle =
  {
    display: "grid",
    gridTemplateColumns: `repeat(${aspectColumns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, ${rowHeight}px)`,
    gridGap: "2px",
    padding: "8px",
  }


  const flowStyle = {
    display: "block",
    width: "100%",
    padding: "4px",
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