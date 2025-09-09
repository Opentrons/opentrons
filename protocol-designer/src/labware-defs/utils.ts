import groupBy from 'lodash/groupBy'

import {
  getAllDefinitions as _getAllDefinitions,
  getAllLegacyDefinitions,
  getLabwareDefURI,
  getUnsupportedLabwareDefVersionsByApiLevel,
  PD_DO_NOT_LIST,
} from '@opentrons/shared-data'
import { PAPI_VERSION } from '@opentrons/step-generation'

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
// filter out all but the latest version of each labware
// NOTE: this is similar to labware-library's getOnlyLatestDefs, but this one
// has the {labwareDefURI: def} shape, instead of an array of labware defs
let _latestDefs: LabwareDefByDefURI | null = null
export function getOnlyLatestDefs(): LabwareDefByDefURI {
  // takes in the given api version and returns a list of labware def versions
  // that are not acceptable: {loadName: [version4, version5, version6]}
  const unacceptableDefVersions = getUnsupportedLabwareDefVersionsByApiLevel(
    PAPI_VERSION
  )

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

        // get disallowed versions for this loadName, if it exists
        const loadName = group[0].parameters.loadName
        const disallowedVersions: number[] =
          unacceptableDefVersions?.[loadName] ?? []

        const disallowed = new Set(disallowedVersions)
        const allowedDefs = group.filter(def => !disallowed.has(def.version))

        // if no allowed defs left, skip this group
        if (allowedDefs.length === 0) {
          return acc
        }

        // find the highest version number among the allowed defs
        const highestVersionNum = Math.max(
          ...allowedDefs.map(def => def.version)
        )
        const latestDefInGroup = allowedDefs.find(
          def => def.version === highestVersionNum
        )

        if (latestDefInGroup == null) {
          return acc
        }

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
