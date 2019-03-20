// @flow
// labware definition helpers
// TODO(mc, 2019-03-18): move to shared-data?
import type {LabwareDefinition2 as LabwareDefinition} from '@opentrons/shared-data'

// require all definitions in the definitions2 directory
// $FlowFixMe: require.context is webpack-specific method
const definitionsContext = require.context(
  '@opentrons/shared-data/definitions2',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

// TODO(mc, 2019-03-18): i18n
const EN_CATEGORY_LABELS = {
  tipRack: 'Tip Rack',
  tubeRack: 'Tube Rack',
  trough: 'Trough',
  trash: 'Trash',
  wellPlate: 'Well Plate',
}

const EN_OTHER = 'Other'

export function getAllDefinitions (): Array<LabwareDefinition> {
  return definitionsContext.keys().map(name => definitionsContext(name))
}

export function getCategoryLabel (category: string): string {
  return EN_CATEGORY_LABELS[category] || EN_OTHER
}
