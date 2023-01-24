import { getLoadedPipette } from './accessors'

import type {
  CompletedProtocolAnalysis,
  PipetteName,
} from '@opentrons/shared-data'

export function getPipetteNameOnMount(
  analysis: CompletedProtocolAnalysis,
  mount: string
): PipetteName | null {
  const loadedPipette = getLoadedPipette(analysis, mount)
  return loadedPipette != null ? loadedPipette.pipetteName : null
}
