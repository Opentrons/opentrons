// @flow

import get from 'lodash/get'
import getLabware from '../getLabware'

const canPipetteUseLabware = (labwareModel: string, pipetteModel: string): ?number => {
  const labware = getLabware(labwareModel)
  if (!labware) {
    console.warn(`No labware definition found for labware ${labwareModel}`)
    return null
  }
  const format = get(labware, 'metadata.properties.format')
  if (!format) {
    console.warn(`No format found for labware ${pipetteModel}`)
    return null
  }
  // TODO: format map pipette
}

export default canPipetteUseLabware
