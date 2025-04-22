import { formatPyStr, uuid } from '../../utils'

import type { CommandCreator } from '../../types'
import type { ConfigureNozzleLayoutParams } from '@opentrons/shared-data'

export const configureNozzleLayout: CommandCreator<ConfigureNozzleLayoutParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, configurationParams } = args
  const { style, primaryNozzle } = configurationParams
  const commands = [
    {
      commandType: 'configureNozzleLayout' as const,
      key: uuid(),
      params: {
        pipetteId,
        configurationParams,
      },
    },
  ]
  const pythonName = invariantContext.pipetteEntities[pipetteId].pythonName
  const startArg =
    primaryNozzle != null ? `, start=${formatPyStr(primaryNozzle)}` : ''

  return {
    commands,
    python: `${pythonName}.configure_nozzle_layout(protocol_api.${style}${startArg})`,
  }
}
