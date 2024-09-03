import { getLoadedPipette } from './accessors'

import type { PipetteName } from '@opentrons/shared-data'
import type { CommandTextData } from '../types'

export function getPipetteNameOnMount(
  commandTextData: CommandTextData,
  mount: string
): PipetteName | null {
  const loadedPipette = getLoadedPipette(commandTextData, mount)
  return loadedPipette != null ? loadedPipette.pipetteName : null
}
