import { getLoadedLabware } from "./accessors"

import type { LabwareLocation } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export function getLabwareLocation(analysis: CompletedProtocolAnalysis, labwareId: string): LabwareLocation {
  const loadedLabware = getLoadedLabware(analysis, labwareId) 
  return loadedLabware != null ? loadedLabware.location : 'offDeck'
}