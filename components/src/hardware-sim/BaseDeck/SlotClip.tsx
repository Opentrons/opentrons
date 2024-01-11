import * as React from 'react'

import { LEGACY_COLORS } from '../../ui-style-constants'

export function SlotClip(props: React.SVGProps<SVGPathElement>): JSX.Element {
  return (
    <path
      fill="none"
      stroke={LEGACY_COLORS.darkBlackEnabled}
      strokeWidth={3}
      strokeOpacity={0.7}
      {...props}
    />
  )
}
