

interface GridCellProps {
  gridArea: [number, number, number, number];
  portrait: boolean;
  children: React.ReactNode;
}


const GridCell: React.FC<GridCellProps> = ({ gridArea, portrait, children }) => {
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