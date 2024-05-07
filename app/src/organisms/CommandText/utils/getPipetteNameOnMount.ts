import { getLoadedPipette } from './accessors'

import type { PipetteName } from '@opentrons/shared-data'
import type { CommandTextData } from '../types'

export function getPipetteNameOnMount(
  protocolData: CommandTextData,
  mount: string
): PipetteName | null {
  const loadedPipette = getLoadedPipette(protocolData, mount)
  return loadedPipette != null ? loadedPipette.pipetteName : null
}
