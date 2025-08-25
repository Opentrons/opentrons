import groupBy from 'lodash/groupBy'

import {
  getAllDefinitions as _getAllDefinitions,
  getAllLegacyDefinitions,
  getGreaterThanVersions,
  getLabwareDefURI,
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
  // pick latest acceptable JSON, example comparing: "2.25" vs "2_26"
  const unacceptableDefVersions = getGreaterThanVersions(PAPI_VERSION)

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

        // filter out any defs that are disallowed at the specific api level
        const unAcceptableDefs = group.filter(def => {
          const disallowedVersionForLoadName: number | null =
            unacceptableDefVersions?.[def.parameters.loadName]
          // if loadName is not include, then allow it still
          if (disallowedVersionForLoadName == null) {
            return true
          }
          // if this specific version is disallowed, then skip
          return def.version !== disallowedVersionForLoadName
        })

        if (unAcceptableDefs.length === 0) {
          return acc
        }
        console.log('unAcceptableDefs', unAcceptableDefs)
        const highestVersionNum = Math.max(
          ...unAcceptableDefs.map(def => def.version)
        )
        console.log('highestVersionNum', highestVersionNum)
        const latestDefInGroup = unAcceptableDefs.find(
          def => def.version === highestVersionNum
        )!

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
