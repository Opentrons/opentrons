import { useEffect, useRef, useState } from 'react'

import { DeckLabelSet, useCommandTypeSummaries } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STANDARD_DECKID,
  getModuleDef,
  HEATERSHAKER_MODULE_TYPE,
  OT2_STANDARD_DECKID,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'

import type {
  CoordinateTuple,
  DeckSlotId,
  ModuleModel,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'

interface ModuleCommandSummaryProps {
  robotType: RobotType
  commandType: RunTimeCommand['commandType']
  showModuleIcon: boolean
  moduleModel: ModuleModel
  position: CoordinateTuple
  orientation: 'left' | 'right'
  slot: DeckSlotId | null
}
// NOTE: a lot of this is similar to ModuleLabel in PD so we should try to combine them
export const ModuleCommandSummary = (
  props: ModuleCommandSummaryProps
): JSX.Element => {
  const {
    moduleModel,
    position,
    orientation,
    slot,
    showModuleIcon = false,
    robotType,
    commandType,
  } = props
  const labelContainerRef = useRef<HTMLDivElement>(null)
  const [labelContainerHeight, setLabelContainerHeight] = useState(12)
  const commandSummary = useCommandTypeSummaries(commandType)

  useEffect(() => {
    if (labelContainerRef.current) {
      setLabelContainerHeight(labelContainerRef.current.offsetHeight)
    }
  }, [])

  const def = getModuleDef(moduleModel)
  const FLEX_STACKER_STATUS = [
    'flexStacker/fill',
    'flexStacker/empty',
    'flexStacker/setStoredLabware',
  ]
  const showHopperAdjustment =
    def?.moduleType === FLEX_STACKER_MODULE_TYPE &&
    FLEX_STACKER_STATUS.includes(commandType)

  const slotTransformKey =
    robotType === FLEX_ROBOT_TYPE ? FLEX_STANDARD_DECKID : OT2_STANDARD_DECKID
  const cornerOffsetsFromSlotFromTransform =
    slot != null
      ? def?.slotTransforms?.[slotTransformKey]?.[slot]?.cornerOffsetFromSlot
      : null
  const tempAdjustmentX =
    def?.moduleType === TEMPERATURE_MODULE_TYPE && orientation === 'right'
      ? def?.dimensions.xDimension - (def?.dimensions.footprintXDimension ?? 0) // shift depending on side of deck
      : 0
  const tempAdjustmentY = def?.moduleType === TEMPERATURE_MODULE_TYPE ? -1 : 0
  const heaterShakerAdjustmentX =
    def?.moduleType === HEATERSHAKER_MODULE_TYPE && orientation === 'right' // shift depending on side of deck
      ? 7 // investigate further why the module definition does not contain sufficient info to find this offset
      : 0
  const hopperAdjustmentX = showHopperAdjustment ? 190 : 0
  const hopperAdjustmentY = showHopperAdjustment ? -5 : 0
  const x =
    position[0] +
    def.cornerOffsetFromSlot.x +
    (cornerOffsetsFromSlotFromTransform?.[0][3] ?? 0) +
    hopperAdjustmentX +
    tempAdjustmentX +
    heaterShakerAdjustmentX -
    1

  const y =
    position[1] +
    def.cornerOffsetFromSlot.y +
    (cornerOffsetsFromSlotFromTransform?.[1][3] ?? 0) -
    labelContainerHeight +
    tempAdjustmentY +
    hopperAdjustmentY

  return (
    <DeckLabelSet
      ref={labelContainerRef}
      deckLabels={[
        {
          text: commandSummary,
          isSelected: true,
          isLast: true,
          moduleModel: def?.model,
          isZoomed: false,
        },
      ]}
      x={x}
      y={y}
      width={def?.dimensions.xDimension + (showHopperAdjustment ? -15 : 2)}
      height={def?.dimensions.yDimension + (showHopperAdjustment ? 10 : 2)}
      showModuleIcon={showModuleIcon}
    />
  )
}
