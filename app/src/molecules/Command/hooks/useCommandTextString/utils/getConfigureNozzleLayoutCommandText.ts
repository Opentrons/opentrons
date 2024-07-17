import { getPipetteNameSpecs } from '@opentrons/shared-data'

import type { ConfigureNozzleLayoutRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetConfigureNozzleLayoutCommandText = Omit<GetCommandText, 'command'> & {
  command: ConfigureNozzleLayoutRunTimeCommand
}

export function getConfigureNozzleLayoutCommandText({
  command,
  commandTextData,
  t,
}: GetConfigureNozzleLayoutCommandText): string {
  const { configurationParams, pipetteId } = command.params
  const pipetteName = commandTextData?.pipettes.find(
    pip => pip.id === pipetteId
  )?.pipetteName

  return t('configure_nozzle_layout', {
    amount: configurationParams.style === 'COLUMN' ? '8' : 'all',
    pipette:
      pipetteName != null ? getPipetteNameSpecs(pipetteName)?.displayName : '',
  })
}
