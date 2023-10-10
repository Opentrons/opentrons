import * as React from 'react'

export function SlotClip(props: React.SVGProps<SVGPathElement>): JSX.Element {
  return (
    <path
      fill="none"
      stroke="#16212D"
      strokeWidth={3}
      strokeOpacity={0.7}
      {...props}
    />
  )
}
