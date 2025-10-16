import { COLORS } from '@opentrons/components'

import type { DeckDefinition } from '@opentrons/shared-data'

export function DeckOverlay(props: { deckDef: DeckDefinition }): JSX.Element {
  const { deckDef } = props
  return (
    <rect
      x={deckDef.cornerOffsetFromOrigin[0]}
      y={deckDef.cornerOffsetFromOrigin[1]}
      width={deckDef.dimensions[0]}
      height={deckDef.dimensions[1]}
      fill={COLORS.black90}
      opacity="0.3"
    />
  )
}
