import { getLoadedLabware } from './accessors'

import { getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'
import { getLabwareDefinitionsFromCommands } from './getLabwareDefinitionsFromCommands'
import type { CommandTextData } from '../types'

const FIXED_TRASH_DEF_URIS = [
  'opentrons/opentrons_1_trash_850ml_fixed/1',
  'opentrons/opentrons_1_trash_1100ml_fixed/1',
  'opentrons/opentrons_1_trash_3200ml_fixed/1',
]
export function getLabwareName(
  commandTextData: CommandTextData,
  labwareId: string
): string {
  const loadedLabware = getLoadedLabware(commandTextData, labwareId)
  if (loadedLabware == null) {
    return ''
  } else if (FIXED_TRASH_DEF_URIS.includes(loadedLabware.definitionUri)) {
    return 'Fixed Trash'
  } else if (loadedLabware.displayName != null) {
    return loadedLabware.displayName
  } else {
    const labwareDef = getLabwareDefinitionsFromCommands(
      commandTextData.commands
    ).find(def => getLabwareDefURI(def) === loadedLabware.definitionUri)
    return labwareDef != null ? getLabwareDisplayName(labwareDef) : ''
  }
}
