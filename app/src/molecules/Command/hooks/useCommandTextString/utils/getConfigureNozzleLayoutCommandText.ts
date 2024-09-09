import { getPipetteSpecsV2 } from '@opentrons/shared-data'

import type { ConfigureNozzleLayoutRunTimeCommand } from '@opentrons/shared-data'
import type { HandlesCommands } from './types'

export function getConfigureNozzleLayoutCommandText({
  command,
  commandTextData,
  t,
}: HandlesCommands<ConfigureNozzleLayoutRunTimeCommand>): string {
  const { configurationParams, pipetteId } = command.params
  const pipetteName = commandTextData?.pipettes.find(
    pip => pip.id === pipetteId
  )?.pipetteName

  const ConfigAmount = {
    SINGLE: '1',
    COLUMN: '8',
    ROW: '12',
    QUADRANT: 'partial',
    ALL: 'all',
  }

  return t('configure_nozzle_layout', {
    amount: ConfigAmount[configurationParams.style],
    pipette:
      pipetteName != null ? getPipetteSpecsV2(pipetteName)?.displayName : '',
  })
}
