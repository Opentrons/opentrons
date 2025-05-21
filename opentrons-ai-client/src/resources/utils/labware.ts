import { groupBy } from 'lodash'

import {
  getAllDefinitions as _getAllDefinitions,
  getLabwareDefURI,
  LABWAREV2_DO_NOT_LIST,
  RETIRED_LABWARE,
} from '@opentrons/shared-data'

import type {
  LabwareDef2ByDefURI,
  LabwareDefinition,
} from '@opentrons/shared-data'

let _definitions: LabwareDef2ByDefURI | null = null

const BLOCK_LIST = [...RETIRED_LABWARE, ...LABWAREV2_DO_NOT_LIST]

export function getAllDefinitions(): LabwareDef2ByDefURI {
  if (_definitions == null) {
    _definitions = _getAllDefinitions(BLOCK_LIST)
  }
  return _definitions
}

// filter out all but the latest version of each labware
// NOTE: this is similar to labware-library's getOnlyLatestDefs, but this one
// has the {labwareDefURI: def} shape, instead of an array of labware defs
let _latestDefs: LabwareDef2ByDefURI | null = null
export function getOnlyLatestDefs(): LabwareDef2ByDefURI {
  if (!_latestDefs) {
    const allDefs = getAllDefinitions()
    const allURIs = Object.keys(allDefs)
    const labwareDefGroups: Record<string, LabwareDefinition[]> = groupBy(
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
