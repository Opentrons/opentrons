// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'

// TODO IMMEDIATELY: getAllDefinitions is copied from labware-library,
// move to shared-data (here, and in labware-library/src/definitions.js !)

// require all definitions in the definitions2 directory
// $FlowFixMe: require.context is webpack-specific method
const definitionsContext = require.context(
  '@opentrons/shared-data/definitions2',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

let definitions = null

export function getAllDefinitions(): Array<LabwareDefinition2> {
  // TODO IMMEDIATELY: unlike labware-library, no filter here
  if (!definitions) {
    definitions = definitionsContext
      .keys()
      .map(name => definitionsContext(name))
  }

  return definitions
}

// TODO IMMEDIATELY / NOTE: this is different than labware library,
// we wanna get by otId not loadName... right?
export function _getSharedLabware(otId: string): ?LabwareDefinition2 {
  const def = getAllDefinitions().find(d => d.otId === otId)
  return def || null
}
