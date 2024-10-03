import { useRef, useState, useEffect } from 'react'
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
  const labelContainerRef = useRef<HTMLDivElement>(null)
  const [labelContainerHeight, setLabelContainerHeight] = useState(0)

  const deckLabels = [
    ...nestedLabwareInfo,
    {
      text: labwareDef.metadata.displayName,
      isSelected: isSelected,
      isLast: isLast,
    },
  ]

  useEffect(() => {
    if (labelContainerRef.current) {
      setLabelContainerHeight(labelContainerRef.current.offsetHeight)
    }
  }, [nestedLabwareInfo])

  return (
    <DeckLabelSet
      ref={labelContainerRef}
      deckLabels={deckLabels}
      x={position[0] - labwareDef.cornerOffsetFromSlot.x}
      y={position[1] + labwareDef.cornerOffsetFromSlot.y - labelContainerHeight}
      width={labwareDef.dimensions.xDimension}
      height={labwareDef.dimensions.yDimension}
    />
  )
}
