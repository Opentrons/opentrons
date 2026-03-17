import { useEffect, useRef, useState } from 'react'

import { DeckLabelSet, useCommandTypeSummaries } from '@opentrons/components'

import type {
  CoordinateTuple,
  LabwareDefinition2,
  RunTimeCommand,
} from '@opentrons/shared-data'

//  NOTE: the deck riser needs special values because the
//  manually created SVG for it is slightly bigger than relying on the
//  cornerOffsetFromSlot and zDimension values. When adjusting them in the definition
//  it looks too small on the deck map, so i think the values in the def
//  are correct? But i'm treating this like a module with adjusted values
const DECK_RISER_ADJUSTED_X = 12
const DECK_RISER_ADJUSTED_Z_DIMENSION = 2

interface LabwareCommandSummaryProps {
  position: CoordinateTuple
  labwareDef: LabwareDefinition2
  showModuleIcon: boolean
  commandType: RunTimeCommand['commandType']
}
export function LabwareCommandSummary(
  props: LabwareCommandSummaryProps
): JSX.Element {
  const { labwareDef, position, showModuleIcon, commandType } = props
  const labelContainerRef = useRef<HTMLDivElement>(null)
  const [labelContainerHeight, setLabelContainerHeight] = useState(0)
  const commandSummary = useCommandTypeSummaries(commandType)
  const deckLabels = [
    {
      text: commandSummary,
      isSelected: true,
      isLast: true,
      isZoomed: false,
    },
  ]

  useEffect(() => {
    if (labelContainerRef.current != null) {
      setLabelContainerHeight(labelContainerRef.current.offsetHeight)
    }
  }, [])

  const showDeckRiserAdjustments =
    labwareDef.parameters.loadName === 'opentrons_flex_deck_riser'

  return (
    <DeckLabelSet
      ref={labelContainerRef}
      deckLabels={deckLabels}
      x={
        position[0] -
        labwareDef.cornerOffsetFromSlot.x -
        (showDeckRiserAdjustments ? DECK_RISER_ADJUSTED_X : 0)
      }
      y={position[1] + labwareDef.cornerOffsetFromSlot.y - labelContainerHeight}
      width={labwareDef.dimensions.xDimension}
      height={
        labwareDef.dimensions.yDimension -
        (showDeckRiserAdjustments ? DECK_RISER_ADJUSTED_Z_DIMENSION : 0)
      }
      showModuleIcon={showModuleIcon}
    />
  )
}
