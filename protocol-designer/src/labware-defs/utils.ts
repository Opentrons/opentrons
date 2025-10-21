import groupBy from 'lodash/groupBy'

import {
  getAllDefinitions as _getAllDefinitions,
  getAllLegacyDefinitions,
  getLabwareDefURI,
  PD_DO_NOT_LIST,
} from '@opentrons/shared-data'

import type {
  LabwareDefinition1,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { LabwareDefByDefURI } from './types'

export function getLegacyLabwareDef(
  loadName: string | null | undefined
): LabwareDefinition1 | null {
  if (loadName != null) {
    return getAllLegacyDefinitions()[loadName]
  }
  return null
}

let _definitions: LabwareDefByDefURI | null = null
export function getAllDefinitions(): LabwareDefByDefURI {
  if (_definitions == null) {
    _definitions = _getAllDefinitions(PD_DO_NOT_LIST)
  }
  return _definitions
}
// filter out all but the latest version of each labware according to the latest
// robot-stack version.
let _latestDefs: LabwareDefByDefURI | null = null
export function getOnlyLatestDefs(): LabwareDefByDefURI {
  const latestLoadnamesByVersion = _OT_PD_LATEST_LABWARE_VERSIONS_
  if (!_latestDefs) {
    const allDefs = getAllDefinitions()
    const allURIs = Object.keys(allDefs)
    const labwareDefGroups: Record<string, LabwareDefinition2[]> = groupBy(
      allURIs.map((uri: string) => allDefs[uri]),
      d => d.parameters.loadName
    )
    _latestDefs = Object.keys(labwareDefGroups).reduce(
      (acc, groupKey: string) => {
        const version = latestLoadnamesByVersion[groupKey]

        //  if the labware is new to a higher up robot-stack version
        //  do not list it with the labware definition at all
        if (version == null) {
          return acc
        }

        const group = labwareDefGroups[groupKey]
        const resultIdx = group.findIndex(d => d.version === version)
        const latestDefInGroup = group[resultIdx]
        return {
          ...acc,
          [getLabwareDefURI(latestDefInGroup)]: latestDefInGroup,
        }
      },
      {}
    )
  }

  return _latestDefs
}
// NOTE: this is different than labware library,
// in PD we wanna get always by labware URI (namespace/loadName/version) never by loadName
export function _getSharedLabware(
  labwareDefURI: string
): LabwareDefinition2 | null | undefined {
  return getAllDefinitions()[labwareDefURI] || null
}
