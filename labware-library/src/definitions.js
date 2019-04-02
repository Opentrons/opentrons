// @flow
// labware definition helpers
// TODO(mc, 2019-03-18): move to shared-data?
import type {LabwareList} from './types'

// require all definitions in the definitions2 directory
// $FlowFixMe: require.context is webpack-specific method
const definitionsContext = require.context(
  '@opentrons/shared-data/definitions2',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

export function getAllDefinitions (): LabwareList {
  // TODO(mc, 2019-03-28): revisit decision to hide trash labware
  return definitionsContext
    .keys()
    .map(name => definitionsContext(name))
    .filter(d => d.metadata.displayCategory !== 'trash')
}
