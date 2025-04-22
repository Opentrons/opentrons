import { getPipetteSpecsV2 } from '@opentrons/shared-data'

import type { HandlesCommands } from '../types'
import type { ConfigureForVolumeRunTimeCommand } from '@opentrons/shared-data/command'

export function getConfigureForVolumeCommandText({
  command,
  commandTextData,
  t,
}: HandlesCommands<ConfigureForVolumeRunTimeCommand>): string {
  const { volume, pipetteId } = command.params
  const pipetteName = commandTextData?.pipettes.find(
    pip => pip.id === pipetteId
  )?.pipetteName

  return t('configure_for_volume', {
    volume,
    pipette:
      pipetteName != null ? getPipetteSpecsV2(pipetteName)?.displayName : '',
  })
}
