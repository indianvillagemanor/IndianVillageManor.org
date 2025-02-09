import { useContext } from "react";
import { WindowContext } from "./window_context";


interface GridCellProps {
  gridArea: [number, number, number, number];
  children: React.ReactNode;
}


const GridCell: React.FC<GridCellProps> = ({ gridArea, children }) => {
  const { portrait } = useContext(WindowContext);
  const [row, column, height, width] = gridArea;
  const style1 = portrait ?
    {
      gridArea: `auto / auto / span ${height} / span 1`,
    } :
    {
      gridArea: `${row} / ${column} / ${row + height} / ${column + width}`,
    }

  const seed = (row + column * 10 + height * 100 + width * 1000);
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const debug = false;
  const style = debug ? { ...style1, backgroundColor: `#${Math.floor(seededRandom(seed) * 16777215).toString(16).padStart(6, '0')}` } : style1;

  return (
    <div style={{ ...style }} className="relative flex items-center justify-center">
      {children}
    </div>
  )
}

export default GridCell