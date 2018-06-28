// @flow
import {
  computeWellAccess,
  getWellTotalVolume
} from './helpers'
import getLabware from './getLabware'

// Requires `make build` to have run to create this .json
import labwareDefinitions from '../build/labware.json'

// Sorted list of all labware
const labwareList: Array<string> = Object.keys(labwareDefinitions).sort()

export * from './types'

export * from './pipettes'

export {
  computeWellAccess,
  getWellTotalVolume,
  getLabware,
  labwareList
}
