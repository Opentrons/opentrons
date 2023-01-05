import { getLoadedLabware } from "./accessors"

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export function getLabwareName(analysis: CompletedProtocolAnalysis, labwareId: string): string {
  const loadedLabware = getLoadedLabware(analysis, labwareId) 
  return loadedLabware != null ? (loadedLabware.displayName ?? loadedLabware.definitionUri) : ''
}