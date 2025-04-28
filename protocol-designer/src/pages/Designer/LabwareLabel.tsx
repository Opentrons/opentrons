import { DeckLabelSet } from '@opentrons/components'
import type { DeckLabelProps } from '@opentrons/components'
import type {
  CoordinateTuple,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { START_TERMINAL_ITEM_ID } from '../../steplist'
import { getSelectedTerminalItemId } from '../../ui/steps'

interface LabwareLabelProps {
  position: CoordinateTuple
  labwareDef: LabwareDefinition2
  isSelected: boolean
  isLast: boolean
  nestedLabwareInfo?: DeckLabelProps[]
  labelText?: string
}
export const LabwareLabel = (props: LabwareLabelProps): JSX.Element => {
  const {
    labwareDef,
    position,
    isSelected,
    isLast,
    nestedLabwareInfo = [],
    labelText = labwareDef.metadata.displayName,
  } = props
  const labelContainerRef = useRef<HTMLDivElement>(null)
  const terminalItemId = useSelector(getSelectedTerminalItemId)
  const [labelContainerHeight, setLabelContainerHeight] = useState(0)
  const deckLabels = [
    {
      text: labelText,
      isSelected: isSelected,
      isLast: isLast,
      isZoomed: terminalItemId === START_TERMINAL_ITEM_ID,
    },
    ...nestedLabwareInfo,
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
