import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { DeckLabelSet } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  FLEX_STANDARD_DECKID,
  getModuleDef,
  HEATERSHAKER_MODULE_TYPE,
  OT2_STANDARD_DECKID,
  TEMPERATURE_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getRobotType } from '../../../file-data/selectors'

import type { ReactNode } from 'react'
import type { DeckLabelProps } from '@opentrons/components'
import type {
  CoordinateTuple,
  DeckSlotId,
  ModuleModel,
} from '@opentrons/shared-data'

const CENTER_SLOT_WIDTH = 160
const CENTER_SLOT_HEIGHT = 106
const VACUUM_OFFSET_X = -19
const VACUUM_OFFSET_Y = -10
const VACUUM_DOCK_OFFSET_X = 7

interface ModuleLabelProps {
  showModuleIcon: boolean
  moduleModel: ModuleModel
  position: CoordinateTuple
  orientation: 'left' | 'right'
  isSelected: boolean
  isLast: boolean
  slot: DeckSlotId | null
  isZoomed?: boolean
  labwareInfos?: DeckLabelProps[]
  labelName?: string
  isVacuumDock?: boolean
}
export const ModuleLabel = (props: ModuleLabelProps): ReactNode => {
  const {
    moduleModel,
    position,
    orientation,
    isSelected,
    isLast,
    labwareInfos = [],
    isZoomed = true,
    labelName,
    slot,
    showModuleIcon = false,
    isVacuumDock = false,
  } = props
  const robotType = useSelector(getRobotType)
  const labelContainerRef = useRef<HTMLDivElement>(null)
  const [labelContainerHeight, setLabelContainerHeight] = useState(12)

  useEffect(() => {
    if (labelContainerRef.current) {
      setLabelContainerHeight(labelContainerRef.current.offsetHeight)
    }
  }, [labwareInfos])

  const def = getModuleDef(moduleModel)
  const slotTransformKey =
    robotType === FLEX_ROBOT_TYPE ? FLEX_STANDARD_DECKID : OT2_STANDARD_DECKID
  const cornerOffsetsFromSlotFromTransform =
    slot != null && !isZoomed
      ? def?.slotTransforms?.[slotTransformKey]?.[slot]?.cornerOffsetFromSlot
      : null
  const tempAdjustmentX =
    def?.moduleType === TEMPERATURE_MODULE_TYPE && orientation === 'right'
      ? def?.dimensions.xDimension - (def?.dimensions.footprintXDimension ?? 0) // shift depending on side of deck
      : 0
  const tempAdjustmentY = def?.moduleType === TEMPERATURE_MODULE_TYPE ? -1 : 0
  const heaterShakerAdjustmentX =
    def?.moduleType === HEATERSHAKER_MODULE_TYPE && orientation === 'right' // shift depending on side of deck
      ? 7 // TODO(ND: 12/18/2024): investigate further why the module definition does not contain sufficient info to find this offset
      : 0

  // This is incredibly unideal, but we need to special case the main vacuum module area, since there are
  // no dimensions living on the module definition that point to the area's dimensions and origin.
  // For the vacuum main area, we fall back to an arbitrary footprint that miimics a center slot's x and y,
  // and manually alignt the label set to the corner of the cutout.
  if (def?.moduleType === VACUUM_MODULE_TYPE) {
    return (
      <DeckLabelSet
        ref={labelContainerRef}
        deckLabels={[
          ...labwareInfos,
          {
            text: labelName ?? def?.displayName,
            isSelected,
            isLast,
            moduleModel: def?.model,
            isZoomed: isZoomed,
          },
        ]}
        x={
          position[0] +
          VACUUM_OFFSET_X +
          (isVacuumDock ? VACUUM_DOCK_OFFSET_X : 0)
        }
        y={position[1] - labelContainerHeight + VACUUM_OFFSET_Y}
        width={CENTER_SLOT_WIDTH}
        height={CENTER_SLOT_HEIGHT}
        showModuleIcon={showModuleIcon}
      />
    )
  }

  return (
    <DeckLabelSet
      ref={labelContainerRef}
      deckLabels={[
        ...labwareInfos,
        {
          text: labelName ?? def?.displayName,
          isSelected,
          isLast,
          moduleModel: def?.model,
          isZoomed: isZoomed,
        },
      ]}
      x={
        position[0] +
        def.cornerOffsetFromSlot.x +
        (cornerOffsetsFromSlotFromTransform?.[0][3] ?? 0) +
        tempAdjustmentX +
        heaterShakerAdjustmentX -
        1
      }
      y={
        position[1] +
        def.cornerOffsetFromSlot.y +
        (cornerOffsetsFromSlotFromTransform?.[1][3] ?? 0) -
        labelContainerHeight +
        tempAdjustmentY
      }
      width={def?.dimensions.xDimension + 2}
      height={def?.dimensions.yDimension + 2}
      showModuleIcon={showModuleIcon}
    />
  )
}
