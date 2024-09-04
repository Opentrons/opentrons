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

  return t('configure_nozzle_layout', {
    amount: configurationParams.style === 'SINGLE' || 'ROW' || 'COLUMN' || 'PARTIAL_COLUMN' ? '8' : 'all',
    pipette:
      pipetteName != null ? getPipetteSpecsV2(pipetteName)?.displayName : '',
  })
}
