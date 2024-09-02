import * as React from 'react'
import { DeckLabelSet } from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  getModuleDef2,
} from '@opentrons/shared-data'
import type { DeckLabelProps } from '@opentrons/components'
import type { CoordinateTuple, ModuleModel } from '@opentrons/shared-data'

interface ModuleLabelProps {
  moduleModel: ModuleModel
  position: CoordinateTuple
  orientation: 'left' | 'right'
  isSelected: boolean
  isLast: boolean
  labwareInfos?: DeckLabelProps[]
}
export const ModuleLabel = (props: ModuleLabelProps): JSX.Element => {
  const {
    moduleModel,
    position,
    orientation,
    isSelected,
    isLast,
    labwareInfos = [],
  } = props
  const def = getModuleDef2(moduleModel)
  const overhang =
    def != null && def?.dimensions.labwareInterfaceXDimension != null
      ? def.dimensions.xDimension - def?.dimensions.labwareInterfaceXDimension
      : 0
  let leftOverhang = overhang
  if (def?.moduleType === TEMPERATURE_MODULE_TYPE) {
    leftOverhang = overhang * 2
  } else if (def?.moduleType === HEATERSHAKER_MODULE_TYPE) {
    leftOverhang = overhang * 1.5
  }
  let tagHeight = 12
  if (labwareInfos.length === 1) {
    tagHeight = 24
  } else if (labwareInfos.length === 2) {
    tagHeight = 36
  }

  return (
    <DeckLabelSet
      deckLabels={[
        {
          text: def.displayName,
          isSelected: isSelected,
          isLast: isLast,
        },
        ...labwareInfos,
      ]}
      x={
        (orientation === 'right'
          ? position[0] - overhang
          : position[0] - leftOverhang) - def.cornerOffsetFromSlot.x
      }
      y={position[1] + def.cornerOffsetFromSlot.y - tagHeight}
      width={def.dimensions.xDimension + 2}
      height={def.dimensions.yDimension + 2}
      isZoomed={true}
    />
  )
}
