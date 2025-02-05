import React from 'react'

const Sandbox = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-blue-500 p-4">Item 1</div>
      <div className="bg-green-500 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-500 p-2">Nested Item 1</div>
          <div className="bg-yellow-500 p-2">Nested Item 2</div>
        </div>
      </div>
      <div className="bg-purple-500 p-4">Item 3</div>
    </div>);
}

export default Sandbox