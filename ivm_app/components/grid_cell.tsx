

interface GridCellProps {
  gridArea: [number, number, number, number];
  children: React.ReactNode;
}


const GridCell: React.FC<GridCellProps> = ({ gridArea: pos, children }) => {
  const [row, column, height, width] = pos;
  const style = {
    gridArea: `${row} / ${column} / ${row + height} / ${column + width}`
  }

  return (
    <div style={style} className="flex items-center justify-center">
      {children}
    </div>
  )
}

export default GridCell