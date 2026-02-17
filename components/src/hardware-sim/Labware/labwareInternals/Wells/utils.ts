import { DEFAULT_TIP_SIZE } from '../Tips/constants'

import type { LabwareDefinition } from '@opentrons/shared-data'

export const getWidthAndHeightOfWellSVG = (
  labwareDefinition: LabwareDefinition
): [number, number] => {
  const firstWell = labwareDefinition.wells.A1
  const wellShape = firstWell.shape

  const width =
    wellShape === 'circular'
      ? (firstWell.diameter ?? DEFAULT_TIP_SIZE)
      : (firstWell.xDimension ?? DEFAULT_TIP_SIZE)

  const height =
    wellShape === 'circular'
      ? (firstWell.diameter ?? DEFAULT_TIP_SIZE)
      : (firstWell.yDimension ?? DEFAULT_TIP_SIZE)

  return [width, height]
}
