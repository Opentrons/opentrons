import { formatPyStr, uuid } from '../../utils'

import type { LiquidProbeParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const liquidProbe: CommandCreator<LiquidProbeParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, labwareId, wellName, wellLocation } = args

  // no-op if pipette does not have tips
  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    return {
      commands: [],
    }
  }

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const labwarePythonName =
    invariantContext.labwareEntities[labwareId].pythonName

  const commands = [
    {
      commandType: 'liquidProbe' as const,
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
    // Note: The Python API doesn't let you specify a starting wellLocation.
    // measure_liquid_height() probes from LIQUID_PROBE_START_OFFSET_FROM_WELL_TOP,
    // which is the same as our SAFE_MOVE_TO_WELL_LOCATION.
    python: `${pipettePythonName}.measure_liquid_height(${labwarePythonName}[${formatPyStr(
      wellName
    )}])`,
  }
}
