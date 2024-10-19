import type { LoadedPipette } from '@opentrons/shared-data'
import type { LoadedPipettes } from '/app/local-resources/instruments/types'

export interface IsPartialTipConfigParams {
  channel: 1 | 8 | 96
  activeNozzleCount: number
}

export function isPartialTipConfig({
  channel,
  activeNozzleCount,
}: IsPartialTipConfigParams): boolean {
  switch (channel) {
    case 1:
      return false
    case 8:
      return activeNozzleCount !== 8
    case 96:
      return activeNozzleCount !== 96
  }
}

export function getLoadedPipette(
  loadedPipettes: LoadedPipettes,
  mount: string
): LoadedPipette | undefined {
  // NOTE: old analysis contains a object dictionary of pipette entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(loadedPipettes)
    ? loadedPipettes.find(l => l.mount === mount)
    : loadedPipettes[mount]
}
