import {
  formatPyStr,
  formatPyWellLocation,
  indentPyLines,
  uuid,
} from '../../utils'

import type { DispenseWhileTrackingParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const dispenseWhileTracking: CommandCreator<
  DispenseWhileTrackingParams
> = (args, invariantContext, prevRobotState) => {
  const {
    pipetteId,
    volume,
    flowRate,
    labwareId,
    wellName,
    trackFromLocation,
    trackToLocation,
  } = args

  const commands = [
    {
      commandType: 'dispenseWhileTracking' as const,
      key: uuid(),
      params: {
        pipetteId,
        volume,
        flowRate,
        labwareId,
        wellName,
        trackFromLocation,
        trackToLocation,
      },
    },
  ]

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const labwarePythonName =
    invariantContext.labwareEntities[labwareId].pythonName
  const wellRef = `${labwarePythonName}[${formatPyStr(wellName)}]`
  const pythonArgs = [
    `volume=${volume}`,
    `location=${wellRef}${formatPyWellLocation(trackFromLocation)}`,
    `flow_rate=${flowRate}`,
    `end_location=${wellRef}${formatPyWellLocation(trackToLocation)}`,
  ]
  const python = `${pipettePythonName}.dispense(\n${indentPyLines(
    pythonArgs.join(',\n')
  )},\n)`

  return {
    commands,
    python,
  }
}
