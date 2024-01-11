import * as React from 'react'

import { COLORS } from '../../ui-style-constants'

export function SlotClip(props: React.SVGProps<SVGPathElement>): JSX.Element {
  return (
    <path
      fill="none"
      stroke={COLORS.darkBlackEnabled}
      strokeWidth={3}
      strokeOpacity={0.7}
      {...props}
    />
  )
}
