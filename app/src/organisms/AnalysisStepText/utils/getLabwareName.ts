import { getLoadedLabware } from "./accessors"

import { CompletedProtocolAnalysis, getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'
import { getLabwareDefinitionsFromCommands } from "../../LabwarePositionCheck/utils/labware"

export function getLabwareName(analysis: CompletedProtocolAnalysis, labwareId: string): string {
  const loadedLabware = getLoadedLabware(analysis, labwareId) 
  if (loadedLabware == null) {
    return ''
  } else if (loadedLabware.displayName != null) {
    return loadedLabware.displayName
  } else {
    const labwareDef = getLabwareDefinitionsFromCommands(analysis.commands).find(
      def => getLabwareDefURI(def) === loadedLabware.definitionUri
    )
    return labwareDef != null ? getLabwareDisplayName(labwareDef) : ''
  }
}