import { getLoadedLabware } from './accessors'

import {
  CompletedProtocolAnalysis,
  getLabwareDefURI,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import { getLabwareDefinitionsFromCommands } from '../../LabwarePositionCheck/utils/labware'

const FIXED_TRASH_DEF_URIS = [
  'opentrons/opentrons_1_trash_850ml_fixed/1',
  'opentrons/opentrons_1_trash_1100ml_fixed/1',
  'opentrons/opentrons_1_trash_3200ml_fixed/1',
]
export function getLabwareName(
  analysis: CompletedProtocolAnalysis,
  labwareId: string
): string {
  const loadedLabware = getLoadedLabware(analysis, labwareId)
  if (loadedLabware == null) {
    return ''
  } else if (FIXED_TRASH_DEF_URIS.includes(loadedLabware.definitionUri)) {
    return 'Fixed Trash'
  } else if (loadedLabware.displayName != null) {
    return loadedLabware.displayName
  } else {
    const labwareDef = getLabwareDefinitionsFromCommands(
      analysis.commands
    ).find(def => getLabwareDefURI(def) === loadedLabware.definitionUri)
    return labwareDef != null ? getLabwareDisplayName(labwareDef) : ''
  }
}
