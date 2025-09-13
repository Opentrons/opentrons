import { getLabwareName } from '../getLabwareName'

import type { SetTipStateRunTimeCommand } from '@opentrons/shared-data/command'
import type { HandlesCommands } from '../types'

export function getTipStateCommandText({
  command,
  allRunDefs,
  t,
  commandTextData,
}: HandlesCommands<SetTipStateRunTimeCommand>): string {
  const { labwareId, tipWellState } = command.params

  return t('set_tip_state', {
    labware:
      commandTextData != null
        ? getLabwareName({
            loadedLabwares: commandTextData?.labware ?? [],
            labwareId,
            allRunDefs,
          })
        : null,
    tip_well_state: tipWellState,
  })
}
