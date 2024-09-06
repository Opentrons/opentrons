import * as React from 'react'
import { DeckLabelSet } from '@opentrons/components'
import type { DeckLabelProps } from '@opentrons/components'
import type {
  CoordinateTuple,
  LabwareDefinition2,
} from '@opentrons/shared-data'

interface ModuleLabelProps {
  position: CoordinateTuple
  labwareDef: LabwareDefinition2
  isSelected: boolean
  isLast: boolean
  nestedLabwareInfo?: DeckLabelProps[]
}
export const LabwareLabel = (props: ModuleLabelProps): JSX.Element => {
  const {
    labwareDef,
    position,
    isSelected,
    isLast,
    nestedLabwareInfo = [],
  } = props
  let tagHeight = 12
  if (nestedLabwareInfo.length === 1) {
    tagHeight = 24
  }
  return (
    <DeckLabelSet
      deckLabels={[
        {
          text: labwareDef.metadata.displayName,
          isSelected: isSelected,
          isLast: isLast,
        },
        ...nestedLabwareInfo,
      ]}
      x={position[0] - labwareDef.cornerOffsetFromSlot.x}
      y={position[1] + labwareDef.cornerOffsetFromSlot.y - tagHeight}
      width={labwareDef.dimensions.xDimension}
      height={labwareDef.dimensions.yDimension}
    />
  )
}
