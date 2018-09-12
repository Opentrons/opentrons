// @flow

import get from 'lodash/get'
import getLabware from '../getLabware'
import {getPipette} from '../pipettes'

const FORMAT_METADATA = {
  '96-standard': {multichannelAccess: true},
  '384-standard': {multichannelAccess: true},
  'trough': {multichannelAccess: true},
  'irregular': {multichannelAccess: false},
}
const canPipetteUseLabware = (pipetteModel: string, labwareModel: string): ?boolean => {
  const labware = getLabware(labwareModel)
  const pipette = getPipette(pipetteModel)
  if (!labware) {
    console.warn(`No labware definition found for labware ${labwareModel}`)
    return null
  }
  const format = get(labware, 'metadata.format')
  if (!format) {
    console.warn(`No format found for labware ${labwareModel}`)
    return null
  }
  if (!pipette) {
    console.warn(`No pipette definition found for pipette ${pipetteModel}`)
    return null
  }
  if (pipette.channels > 1) {
    return FORMAT_METADATA[format].multichannelAccess
  } else {
    return true
  }
  // TODO: format map pipette
}

export default canPipetteUseLabware
