import * as React from 'react'

import { COLORS } from '../../helix-design-system'

export function SlotClip(props: React.SVGProps<SVGPathElement>): JSX.Element {
  return (
    <path
      fill="none"
      stroke={COLORS.black90}
      strokeWidth={3}
      strokeOpacity={0.7}
      {...props}
    />
  )
}
