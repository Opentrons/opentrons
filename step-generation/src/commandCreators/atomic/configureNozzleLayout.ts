import { H1_NOZZLE, PARTIAL_COLUMN } from '@opentrons/shared-data'

import { formatPyStr, indentPyLines, uuid } from '../../utils'

import type { ConfigureNozzleLayoutParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const configureNozzleLayout: CommandCreator<
  ConfigureNozzleLayoutParams
> = (args, invariantContext, prevRobotState) => {
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
  let pythonArgs: string[]
  if (style === PARTIAL_COLUMN) {
    pythonArgs = [
      `protocol_api.${style}`,
      ...(primaryNozzle != null
        ? [`start=${formatPyStr(H1_NOZZLE)}, end=${formatPyStr(primaryNozzle)}`]
        : []),
    ]
  } else {
    pythonArgs = [
      `protocol_api.${style}`,
      ...(primaryNozzle != null ? [`start=${formatPyStr(primaryNozzle)}`] : []),
    ]
  }

  return {
    commands,
    python: `${pythonName}.configure_nozzle_layout(\n${indentPyLines(
      pythonArgs.join(',\n')
    )},\n)`,
  }
}
