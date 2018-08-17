// @flow
import getLabware, {getWellDefsForSVG, getIsTiprack} from './getLabware'

// Requires `make build` to have run to create this .json
import labwareDefinitions from '../build/labware.json'

// Sorted list of all labware
const labwareList: Array<string> = Object.keys(labwareDefinitions).sort()

export * from './constants'
export * from './helpers'
export * from './pipettes'
export * from './types'

export {
  getLabware,
  getWellDefsForSVG,
  getIsTiprack,
  labwareList
}
