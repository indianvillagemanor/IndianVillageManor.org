import { CSSProperties, useContext } from "react";
import { WindowContext } from "./window_context";


interface GridCellProps {
  gridArea: [number, number, number, number];
  fixedHeight?: boolean | number;
  children: React.ReactNode;
}


const GridCell: React.FC<GridCellProps> = ({ gridArea, fixedHeight, children }) => {
  const { portrait, rowHeight } = useContext(WindowContext);
  const [row, column, height, width] = gridArea;

  const seed = (row + column * 10 + height * 100 + width * 1000);
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const debug = false;
  const debugStyle = debug ? { backgroundColor: `#${Math.floor(seededRandom(seed) * 16777215).toString(16).padStart(6, '0')}` } : {};

  const commonStyle: CSSProperties = {
    position: "relative",
  }

  const flowStyle = fixedHeight
    ? ((typeof fixedHeight === 'boolean')
      ? { height: `${height * rowHeight}px` }
      : { height: `${fixedHeight}px` })
    : {}

  // { height: `${height * rowHeight}px` } : {}
  const gridStyle = {
    gridRowStart: row,
    gridColumnStart: column,
    gridRowEnd: row + height,
    gridColumnEnd: column + width,
  }

  const orientationStyle = portrait ? flowStyle : gridStyle;

  const style = {
    ...commonStyle, ...orientationStyle, ...debugStyle
  };

  return (
    <div style={style}>
      {children}
    </div>
  )
}

export default GridCell