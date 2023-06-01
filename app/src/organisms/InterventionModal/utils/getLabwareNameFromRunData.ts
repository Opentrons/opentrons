import {
  RunTimeCommand,
  getLabwareDefURI,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import { getLoadedLabware } from '../../CommandText/utils/accessors'
import { getLabwareDefinitionsFromCommands } from '../../LabwarePositionCheck/utils/labware'

import type { RunData } from '@opentrons/api-client'

const FIXED_TRASH_DEF_URI = 'opentrons/opentrons_1_trash_1100ml_fixed/1'
export function getLabwareNameFromRunData(
  protocolData: RunData,
  labwareId: string,
  commands: RunTimeCommand[]
): string {
  const loadedLabware = getLoadedLabware(protocolData, labwareId)
  if (loadedLabware == null) {
    return ''
  } else if (loadedLabware.definitionUri === FIXED_TRASH_DEF_URI) {
    return 'Fixed Trash'
  } else if (loadedLabware.displayName != null) {
    return loadedLabware.displayName
  } else {
    const labwareDef = getLabwareDefinitionsFromCommands(commands).find(
      def => getLabwareDefURI(def) === loadedLabware.definitionUri
    )
    return labwareDef != null ? getLabwareDisplayName(labwareDef) : ''
  }
}
