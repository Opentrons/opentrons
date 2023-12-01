import { uuid } from '../../utils'
import type { NozzleConfigurationStyle } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

interface configureNozzleLayoutArgs {
  pipetteId: string
  nozzles: NozzleConfigurationStyle
}

export const configureNozzleLayout: CommandCreator<configureNozzleLayoutArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, nozzles } = args

  const commands = [
    {
      commandType: 'configureNozzleLayout' as const,
      key: uuid(),
      params: {
        pipetteId,
        configurationParams: {
          primaryNozzle: nozzles === 'COLUMN' ? 'A12' : 'A1', // TODO(jr, 11/16/23): wire this up when we support other nozzle configurations
          style: nozzles,
        },
      },
    },
  ]
  return {
    commands,
  }
}
