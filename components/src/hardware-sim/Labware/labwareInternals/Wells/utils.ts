import { DEFAULT_TIP_SIZE } from '../Tips/constants'

import type { LabwareWellMap } from '@opentrons/shared-data'

export const getWidthAndHeightOfWellSVG = (
  wellMap: LabwareWellMap
): [number, number] => {
  const firstWell = wellMap.A1
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
