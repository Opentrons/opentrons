import { getPipetteNameSpecs } from '@opentrons/shared-data'

import type { PrepareToAspirateRunTimeCommand } from '@opentrons/shared-data/command'
import type { GetCommandText } from '..'

type GetPrepareToAspirateCommandText = Omit<GetCommandText, 'command'> & {
  command: PrepareToAspirateRunTimeCommand
}

export function getPrepareToAspirateCommandText({
  command,
  commandTextData,
  t,
}: GetPrepareToAspirateCommandText): string {
  const { pipetteId } = command.params
  const pipetteName = commandTextData?.pipettes.find(
    pip => pip.id === pipetteId
  )?.pipetteName

  return t('prepare_to_aspirate', {
    pipette:
      pipetteName != null ? getPipetteNameSpecs(pipetteName)?.displayName : '',
  })
}
