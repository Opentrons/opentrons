import { ALL, COLUMN, ROW } from '@opentrons/shared-data'

import type {
  LabwareDefinition,
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { PipetteEntity, Point } from '../types'

export const getPipetteCriticalPoint = (
  nozzleConfiguration: NozzleConfigurationStyle,
  pipetteEntity: PipetteEntity,
  primaryNozzle: PrimaryNozzleConfigurationStyle,
  labwareDefinition: LabwareDefinition
): Point => {
  const { spec } = pipetteEntity
  const isRow = nozzleConfiguration === ROW
  const isColumn =
    nozzleConfiguration === COLUMN ||
    (nozzleConfiguration === ALL && spec.channels === 8)
  const labwareHasOneRow = labwareDefinition.ordering[0].length === 1
  if (isRow && labwareHasOneRow) {
    // return the XY CENTER
    const frontPoint = isColumn
      ? `H${primaryNozzle.slice(1)}`
      : `${primaryNozzle.charAt(0)}12`
    const frontRightPoint = spec.nozzleMap[frontPoint]
    const backLeftPoint = spec.nozzleMap[primaryNozzle]
    const difference = frontRightPoint.map(
      (value, index) => value - backLeftPoint[index]
    )
    const differenceOffset = [difference[0] / 2, difference[1] / 2, 0]
    const newPoint = backLeftPoint.map(
      (value, index) => value + differenceOffset[index]
    )
    return {
      x: newPoint[0],
      y: newPoint[1],
      z: newPoint[2],
    }
  }
  const defaultPosition = spec.nozzleMap[primaryNozzle]

  return {
    x: defaultPosition[0],
    y: defaultPosition[1],
    z: defaultPosition[2],
  }
}
