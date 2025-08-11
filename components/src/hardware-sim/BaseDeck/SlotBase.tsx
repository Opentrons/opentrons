import type { SVGProps } from 'react'

export function SlotBase(props: SVGProps<SVGPathElement>): JSX.Element {
  return <path {...props} />
}
