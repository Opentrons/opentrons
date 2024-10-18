import { getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'

import { getLoadedLabware } from './getLoadedLabware'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LoadedLabwares } from '/app/local-resources/labware'

const FIXED_TRASH_DEF_URIS = [
  'opentrons/opentrons_1_trash_850ml_fixed/1',
  'opentrons/opentrons_1_trash_1100ml_fixed/1',
  'opentrons/opentrons_1_trash_3200ml_fixed/1',
]

export interface GetLabwareNameParams {
  allRunDefs: LabwareDefinition2[]
  loadedLabwares: LoadedLabwares
  labwareId: string
}

export function getLabwareName({
  allRunDefs,
  loadedLabwares,
  labwareId,
}: GetLabwareNameParams): string {
  const loadedLabware = getLoadedLabware(loadedLabwares, labwareId)
  if (loadedLabware == null) {
    return ''
  } else if (FIXED_TRASH_DEF_URIS.includes(loadedLabware.definitionUri)) {
    return 'Fixed Trash'
  } else if (loadedLabware.displayName != null) {
    return loadedLabware.displayName
  } else {
    const labwareDef = allRunDefs.find(
      def => getLabwareDefURI(def) === loadedLabware.definitionUri
    )
    return labwareDef != null ? getLabwareDisplayName(labwareDef) : ''
  }
}
