// @flow
import groupBy from 'lodash/groupBy'
import {
  getLabwareDefURI,
  PD_DO_NOT_LIST,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
import type { LabwareDefByDefURI } from './types'

// TODO: Ian 2019-04-11 getAllDefinitions also exists (differently) in labware-library,
// should reconcile differences & make a general util fn imported from shared-data

// require all definitions in the labware/definitions/2 directory
// $FlowFixMe: require.context is webpack-specific method
const definitionsContext = require.context(
  '@opentrons/shared-data/labware/definitions/2',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

let _definitions = null
export function getAllDefinitions(): LabwareDefByDefURI {
  // NOTE: unlike labware-library, no filtering out trashes here (we need 'em)
  // also, more convenient & performant to make a map {labwareDefURI: def} not an array
  if (!_definitions) {
    _definitions = definitionsContext.keys().reduce((acc, filename) => {
      const def: LabwareDefinition2 = definitionsContext(filename)
      const labwareDefURI = getLabwareDefURI(def)
      return PD_DO_NOT_LIST.includes(def.parameters.loadName)
        ? acc
        : { ...acc, [labwareDefURI]: def }
    }, {})
  }

  return _definitions
}

// filter out all but the latest version of each labware
// NOTE: this is similar to labware-library's getOnlyLatestDefs, but this one
// has the {labwareDefURI: def} shape, instead of an array of labware defs
let _latestDefs = null
export function getOnlyLatestDefs(): LabwareDefByDefURI {
  if (!_latestDefs) {
    const allDefs = getAllDefinitions()
    const allURIs = Object.keys(allDefs)
    const labwareDefGroups: {
      [groupKey: string]: Array<LabwareDefinition2>,
    } = groupBy(
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
export function _getSharedLabware(labwareDefURI: string): ?LabwareDefinition2 {
  return getAllDefinitions()[labwareDefURI] || null
}
