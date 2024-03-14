import groupBy from 'lodash/groupBy'
import {
  getLabwareDefURI,
  PD_DO_NOT_LIST,
  LabwareDefinition1,
  LabwareDefinition2,
  getAllDefinitions as _getAllDefinitions,
  getAllLegacyDefinitions,
} from '@opentrons/shared-data'
import { LabwareDefByDefURI } from './types'

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
// filter out all but the latest version of each labware
// NOTE: this is similar to labware-library's getOnlyLatestDefs, but this one
// has the {labwareDefURI: def} shape, instead of an array of labware defs
let _latestDefs: LabwareDefByDefURI | null = null
export function getOnlyLatestDefs(): LabwareDefByDefURI {
  if (!_latestDefs) {
    const allDefs = getAllDefinitions()
    const allURIs = Object.keys(allDefs)
    const labwareDefGroups: Record<string, LabwareDefinition2[]> = groupBy(
      allURIs.map((uri: string) => allDefs[uri]),
      d => `${d.namespace}/${d.parameters.loadName}`
    )
    _latestDefs = Object.keys(labwareDefGroups).reduce(
      (acc, groupKey: string) => {
        const group = labwareDefGroups[groupKey]
        const allVersions = group.map(d => d.version)
        const highestVersionNum = Math.max(...allVersions)
        const resultIdx = group.findIndex(d => d.version === highestVersionNum)
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
