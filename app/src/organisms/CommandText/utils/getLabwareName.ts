import { getLoadedLabware } from './accessors'

import {
  CompletedProtocolAnalysis,
  RunTimeCommand,
  getLabwareDefURI,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import { getLabwareDefinitionsFromCommands } from '../../LabwarePositionCheck/utils/labware'

import type { RunData } from '@opentrons/api-client'

const FIXED_TRASH_DEF_URI = 'opentrons/opentrons_1_trash_1100ml_fixed/1'
export function getLabwareName(
  protocolData: CompletedProtocolAnalysis | RunData,
  labwareId: string,
  commands?: RunTimeCommand[]
): string {
  const loadedLabware = getLoadedLabware(protocolData, labwareId)
  console.log({ loadedLabware })
  if (loadedLabware == null) {
    console.log('loaded labware was null')
    return ''
  } else if (loadedLabware.definitionUri === FIXED_TRASH_DEF_URI) {
    console.log('loaded labware was trash')
    return 'Fixed Trash'
  } else if (loadedLabware.displayName != null) {
    console.log('loaded labware has display name')
    return loadedLabware.displayName
  } else if ('commands' in protocolData) {
    const labwareDef = getLabwareDefinitionsFromCommands(
      protocolData.commands
    ).find(def => getLabwareDefURI(def) === loadedLabware.definitionUri)
    return labwareDef != null ? getLabwareDisplayName(labwareDef) : ''
  } else if (commands != null) {
    const labwareDef = getLabwareDefinitionsFromCommands(commands).find(
      def => getLabwareDefURI(def) === loadedLabware.definitionUri
    )
    return labwareDef != null ? getLabwareDisplayName(labwareDef) : ''
  } else {
    console.error('loaded labware exhausted all options')
    return ''
  }
}
