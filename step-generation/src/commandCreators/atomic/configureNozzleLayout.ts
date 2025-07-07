import { formatPyStr, indentPyLines, uuid } from '../../utils'

import type { ConfigureNozzleLayoutParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

interface ConfigureNozzleLayoutAtomicParams
  extends ConfigureNozzleLayoutParams {
  tiprackId: string
}
export const configureNozzleLayout: CommandCreator<ConfigureNozzleLayoutAtomicParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, configurationParams, tiprackId } = args
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
  const pythonTiprackName =
    invariantContext.labwareEntities[tiprackId].pythonName

  const pythonArgs = [
    `protocol_api.${style}`,
    ...(primaryNozzle != null ? [`start=${formatPyStr(primaryNozzle)}`] : []),
    `tip_racks=[${pythonTiprackName}]`,
  ]

  return {
    commands,
    python: `${pythonName}.configure_nozzle_layout(\n${indentPyLines(
      pythonArgs.join(',\n')
    )},\n)`,
  }
}
