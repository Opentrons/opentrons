import { formatPyStr, uuid } from '../../utils'

import type {
  CreateCommand,
  TryLiquidProbeCreateCommand,
} from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const tryLiquidProbe: CommandCreator<
  TryLiquidProbeCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { pipetteId, labwareId, wellName, wellLocation } = args

  const { pipetteEntities } = invariantContext

  const pipettePythonName = pipetteEntities[pipetteId].pythonName
  const labwarePythonName =
    invariantContext.labwareEntities[labwareId].pythonName

  const commands: CreateCommand[] = [
    {
      commandType: 'tryLiquidProbe',
      key: uuid(),
      params: {
        pipetteId,
        labwareId,
        wellName,
        wellLocation,
      },
    },
  ]
  return {
    commands,
    python: `${pipettePythonName}.detect_liquid_presence(${labwarePythonName}[${formatPyStr(
      wellName
    )}])`,
  }
}
