import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { DeckLabelSet } from '@opentrons/components'

import {
  VACUUM_COLLAR_OFFSET_MM_FROM_CORNER_X,
  VACUUM_COLLAR_OFFSET_MM_FROM_CORNER_Y,
} from '/protocol-designer/constants'

import { selectors } from '../../labware-ingred/selectors'
import { START_TERMINAL_ITEM_ID } from '../../steplist'
import { getSelectedTerminalItemId } from '../../ui/steps'
import { getIsVacuumCollar } from './DeckSetup/utils'

import type { DeckLabelProps } from '@opentrons/components'
import type {
  CoordinateTuple,
  LabwareDefinition2,
} from '@opentrons/shared-data'

//  NOTE: the deck riser needs special values because the
//  manually created SVG for it is slightly bigger than relying on the
//  cornerOffsetFromSlot and zDimension values. When adjusting them in the definition
//  it looks too small on the deck map, so i think the values in the def
//  are correct? But i'm treating this like a module with adjusted values
const DECK_RISER_ADJUSTED_X = 12
const DECK_RISER_ADJUSTED_Z_DIMENSION = 2

interface LabwareLabelProps {
  position: CoordinateTuple
  labwareDef: LabwareDefinition2
  isSelected: boolean
  isLast: boolean
  showModuleIcon: boolean
  nestedLabwareInfo?: DeckLabelProps[]
  labelText?: string
}
export const LabwareLabel = (props: LabwareLabelProps): JSX.Element => {
  const {
    labwareDef,
    position,
    isSelected,
    isLast,
    showModuleIcon,
    nestedLabwareInfo = [],
    labelText = labwareDef.metadata.displayName,
  } = props
  const labelContainerRef = useRef<HTMLDivElement>(null)
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedTopLabware } = selectedSlotInfo
  const terminalItemId = useSelector(getSelectedTerminalItemId)
  const [labelContainerHeight, setLabelContainerHeight] = useState(0)
  const greaterThan1 = selectedTopLabware.amount > 1
  const deckLabels = [
    {
      text: greaterThan1
        ? `${labelText} (${selectedTopLabware.amount})`
        : labelText,
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

  const showDeckRiserAdjustments =
    labwareDef.parameters.loadName === 'opentrons_flex_deck_riser' &&
    nestedLabwareInfo.length === 0

  const isVacuumCollar = getIsVacuumCollar(labwareDef)
  const [vacuumCollarAdjustmentX, vacuumCollarAdjustmentY] = isVacuumCollar
    ? [
        VACUUM_COLLAR_OFFSET_MM_FROM_CORNER_X,
        VACUUM_COLLAR_OFFSET_MM_FROM_CORNER_Y,
      ]
    : [0, 0]
  return (
    <DeckLabelSet
      ref={labelContainerRef}
      deckLabels={deckLabels}
      x={
        position[0] +
        labwareDef.cornerOffsetFromSlot.x -
        (showDeckRiserAdjustments ? DECK_RISER_ADJUSTED_X : 0) +
        vacuumCollarAdjustmentX
      }
      y={
        position[1] +
        labwareDef.cornerOffsetFromSlot.y -
        labelContainerHeight +
        vacuumCollarAdjustmentY
      }
      width={labwareDef.dimensions.xDimension}
      height={
        labwareDef.dimensions.yDimension -
        (showDeckRiserAdjustments ? DECK_RISER_ADJUSTED_Z_DIMENSION : 0)
      }
      showModuleIcon={showModuleIcon}
    />
  )
}
