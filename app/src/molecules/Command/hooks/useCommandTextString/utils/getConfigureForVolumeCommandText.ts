import { getPipetteNameSpecs } from '@opentrons/shared-data'

import type { ConfigureForVolumeRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetConfigureForVolumeCommandText = Omit<GetCommandText, 'command'> & {
  command: ConfigureForVolumeRunTimeCommand
}

export function getConfigureForVolumeCommandText({
  command,
  commandTextData,
  t,
}: GetConfigureForVolumeCommandText): string {
  const { volume, pipetteId } = command.params
  const pipetteName = commandTextData?.pipettes.find(
    pip => pip.id === pipetteId
  )?.pipetteName

  return t('configure_for_volume', {
    volume,
    pipette:
      pipetteName != null ? getPipetteNameSpecs(pipetteName)?.displayName : '',
  })
}
