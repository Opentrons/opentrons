import * as React from 'react'

export function SlotBase(props: React.SVGProps<SVGPathElement>): JSX.Element {
  return <path fill="#CCCCCC" {...props} />
}
