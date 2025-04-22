import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
import type { LiquidProbeParams } from '@opentrons/shared-data'

export const liquidProbe: CommandCreator<LiquidProbeParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, labwareId, wellName, wellLocation } = args

  // no-op if pipette does not have tips
  if (!prevRobotState.tipState.pipettes[pipetteId]) {
    return {
      commands: [],
    }
  }

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
  }
}
