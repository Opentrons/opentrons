import { getLoadedPipette } from '/app/local-resources/instruments'

import type { PipetteName } from '@opentrons/shared-data'
import type { LoadedPipettes } from '/app/local-resources/instruments/types'

export function getPipetteNameOnMount(
  loadedPipettes: LoadedPipettes,
  mount: string
): PipetteName | null {
  const loadedPipette = getLoadedPipette(loadedPipettes, mount)
  return loadedPipette != null ? loadedPipette.pipetteName : null
}
