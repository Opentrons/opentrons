import { getPipetteSpecsV2 } from '@opentrons/shared-data'

import type { HandlesCommands } from '../types'
import type { PrepareToAspirateRunTimeCommand } from '@opentrons/shared-data/command'

export function getPrepareToAspirateCommandText({
  command,
  commandTextData,
  t,
}: HandlesCommands<PrepareToAspirateRunTimeCommand>): string {
  const { pipetteId } = command.params
  const pipetteName = commandTextData?.pipettes.find(
    pip => pip.id === pipetteId
  )?.pipetteName

  return t('prepare_to_aspirate', {
    pipette:
      pipetteName != null ? getPipetteSpecsV2(pipetteName)?.displayName : '',
  })
}
