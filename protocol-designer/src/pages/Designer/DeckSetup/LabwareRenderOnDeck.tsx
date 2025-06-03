import { LabwareRender } from '@opentrons/components'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

interface LabwareRenderOnDeckProps {
  labwareDef: LabwareDefinition2
  x: number
  y: number
}
export function LabwareRenderOnDeck(
  props: LabwareRenderOnDeckProps
): JSX.Element {
  const { x, y, labwareDef } = props
  return (
    // TODO BEFORE MERGE: How is this different from LabwareOnDeck
    // TODO BEFORE MERGE: Same comment as LabwareOnDeck: This seems fine in isolation but we need to audit usages of LabwareRenderOnDeck to make sure they're passing in the correct thing for x/y
    <g transform={`translate(${x}, ${y})`}>
      <LabwareRender definition={labwareDef} />
    </g>
  )
}
