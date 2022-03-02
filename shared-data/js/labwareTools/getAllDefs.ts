import type { LabwareDefinition2 } from '../types'

// require all definitions in the labware/definitions/2 directory
// require.context is webpack-specific method
const definitionsContext = require.context(
  '../../labware/definitions/2',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

export function getAllDefs(): LabwareDefinition2[] {
  return definitionsContext.keys().map(name => definitionsContext(name))
}
