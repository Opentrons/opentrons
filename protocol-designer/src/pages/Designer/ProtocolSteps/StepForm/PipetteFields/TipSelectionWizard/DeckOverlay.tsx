import { COLORS } from '@opentrons/components'

import type { ReactNode } from 'react'
import type { DeckDefinition } from '@opentrons/shared-data'

export function DeckOverlay(props: { deckDef: DeckDefinition }): ReactNode {
  const { deckDef } = props
  return (
    <rect
      x={deckDef.cornerOffsetFromOrigin[0]}
      y={deckDef.cornerOffsetFromOrigin[1]}
      width={deckDef.dimensions[0]}
      height={deckDef.dimensions[1]}
      fill={`${COLORS.grey10}${COLORS.opacity60HexCode}`}
    />
  )
}
