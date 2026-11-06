import { useLayoutEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { CenterLabwareInSlot, DeckLabelSet } from '@opentrons/components'
import { getLabwareViewBox } from '@opentrons/shared-data'

import {
  VACUUM_COLLAR_OFFSET_MM_FROM_CORNER_X,
  VACUUM_COLLAR_OFFSET_MM_FROM_CORNER_Y,
} from '/protocol-designer/constants'

import { selectors } from '../../labware-ingred/selectors'
import { START_TERMINAL_ITEM_ID } from '../../steplist'
import { getSelectedTerminalItemId } from '../../ui/steps'
import { getIsVacuumCollar } from './DeckSetup/utils'

import type { ReactNode } from 'react'
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
  /** Match LabwareOnDeck: default true; false for off-deck zoom (no slot). */
  centerInSlot?: boolean
}
export const LabwareLabel = (props: LabwareLabelProps): ReactNode => {
  const {
    labwareDef,
    position,
    isSelected,
    isLast,
    showModuleIcon,
    nestedLabwareInfo = [],
    labelText = labwareDef.metadata.displayName,
    centerInSlot = true,
  } = props
  const labelContainerRef = useRef<HTMLDivElement>(null)
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedTopLabware } = selectedSlotInfo
  const terminalItemId = useSelector(getSelectedTerminalItemId)
  const [labelContainerHeight, setLabelContainerHeight] = useState(0)
  const greaterThan1 = selectedTopLabware.amount > 1
  const isZoomed = terminalItemId === START_TERMINAL_ITEM_ID
  const deckLabels = [
    {
      text: greaterThan1
        ? `${labelText} (${selectedTopLabware.amount})`
        : labelText,
      isSelected,
      isLast,
      isZoomed,
    },
    ...nestedLabwareInfo,
  ]

  useLayoutEffect(() => {
    const currentRef = labelContainerRef.current
    if (currentRef == null) {
      return
    }
    const updateHeight = (): void => {
      // In RobotCoordsForeignDiv, 1 CSS px ≈ 1 SVG user unit, so the
      // stack's offsetHeight is the y-shift needed to keep the outline on the
      // labware and the label in sync.
      const measuredHeight = currentRef.offsetHeight
      if (measuredHeight > 0) {
        setLabelContainerHeight(measuredHeight)
      }
    }
    updateHeight()
    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(currentRef)
    return () => {
      resizeObserver.disconnect()
    }
  }, [deckLabels.length, labelText, isZoomed, greaterThan1])

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
  const { xDimension, yDimension } = getLabwareViewBox(labwareDef)
  const width = xDimension
  const height =
    yDimension -
    (showDeckRiserAdjustments ? DECK_RISER_ADJUSTED_Z_DIMENSION : 0)
  const xAdjust =
    -(showDeckRiserAdjustments ? DECK_RISER_ADJUSTED_X : 0) +
    vacuumCollarAdjustmentX
  const yAdjust = -labelContainerHeight + vacuumCollarAdjustmentY

  // When centered, CenterLabwareInSlot owns the slot→labware origin shift;
  // DeckLabelSet coords are relative to that labware origin.
  const labelX = centerInSlot
    ? xAdjust
    : position[0] + labwareDef.cornerOffsetFromSlot.x + xAdjust
  const labelY = centerInSlot
    ? yAdjust
    : position[1] + labwareDef.cornerOffsetFromSlot.y + yAdjust

  const deckLabelSet = (
    <DeckLabelSet
      ref={labelContainerRef}
      deckLabels={deckLabels}
      x={labelX}
      y={labelY}
      width={width}
      height={height}
      showModuleIcon={showModuleIcon}
    />
  )

  if (!centerInSlot) {
    return deckLabelSet
  }

  return (
    <g transform={`translate(${position[0]}, ${position[1]})`}>
      <CenterLabwareInSlot definition={labwareDef}>
        {deckLabelSet}
      </CenterLabwareInSlot>
    </g>
  )
}
