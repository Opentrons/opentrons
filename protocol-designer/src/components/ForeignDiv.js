import React from 'react'

export default function ForeignDiv ({children, x = 0, y = 0, height = '100%', width = '100%', className}) {
  return (
    <foreignObject {...{x, y, height, width, className}}>
      <div xmlns='http://www.w3.org/1999/xhtml'>
        {children}
      </div>
    </foreignObject>
  )
}
