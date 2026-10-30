import type { ReactNode, SVGProps } from 'react'

export function SlotBase(props: SVGProps<SVGPathElement>): ReactNode {
  return <path data-testid={'slot-base'} {...props} />
}
