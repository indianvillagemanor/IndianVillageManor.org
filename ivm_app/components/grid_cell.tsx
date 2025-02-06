import { useContext } from "react";
import { WindowContext } from "./window_context";


interface GridCellProps {
  gridArea: [number, number, number, number];
  children: React.ReactNode;
}


const GridCell: React.FC<GridCellProps> = ({ gridArea, children }) => {
  const { portrait, rowHeight } = useContext(WindowContext);
  const [row, column, height, width] = gridArea;
  const style = portrait ?
    {
      gridArea: `auto / auto / span ${height} / span 1`
    } :
    {
      gridArea: `${row} / ${column} / ${row + height} / ${column + width}`
    }

  return (
    <div style={style} className="flex items-center justify-center">
      {children}
    </div>
  )
}

export default GridCell