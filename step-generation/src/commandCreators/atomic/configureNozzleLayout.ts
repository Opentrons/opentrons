import { COLUMN } from '@opentrons/shared-data'
import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
import type { NozzleConfigurationStyle } from '@opentrons/shared-data'

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
          primaryNozzle: nozzles === COLUMN ? 'A12' : undefined,
          style: nozzles,
        },
      },
    },
  ]
  return {
    commands,
  }
}
