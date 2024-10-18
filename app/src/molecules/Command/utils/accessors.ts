import type { LoadedPipette } from '@opentrons/shared-data'
import type { CommandTextData } from '../types'

export function getLoadedPipette(
  commandTextData: CommandTextData,
  mount: string
): LoadedPipette | undefined {
  // NOTE: old analysis contains a object dictionary of pipette entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(commandTextData.pipettes)
    ? commandTextData.pipettes.find(l => l.mount === mount)
    : commandTextData.pipettes[mount]
}
