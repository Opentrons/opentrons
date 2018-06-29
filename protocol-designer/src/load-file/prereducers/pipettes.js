// @flow
import mapValues from 'lodash/mapValues'

import {getPipette} from '@opentrons/shared-data'

import type {FilePipette, ProtocolFile} from '../../file-types'
import type {PipetteReducerState} from '../../pipettes/reducers'
import type {PipetteData} from '../../step-generation'

// TODO IMMEDIATELY have space in file for pipette tiprack type
const TODO_TIPRACK_MODEL = 'tiprack-10ul'

// TODO: Ian 2018-06-28 replace createPipette fn in pipettes/reducers.js with this one?
function createPipette (p: FilePipette, id: string, tiprackModel: string): ?PipetteData {
  const pipetteData = getPipette(p.model)
  if (!pipetteData) {
    console.error(`Pipette model '${p.model}' does not exist in shared-data`)
    return null
  }
  return {
    id,
    mount: p.mount,
    maxVolume: pipetteData.nominalMaxVolumeUl,
    channels: pipetteData.channels,
    tiprackModel
  }
}

const pipettes = (file: ProtocolFile): PipetteReducerState => {
  const {pipettes} = file
  const pipetteIds = Object.keys(pipettes)
  return {
    byMount: {
      left: pipetteIds.find(id => pipettes[id].mount === 'left'),
      right: pipetteIds.find(id => pipettes[id].mount === 'right')
    },
    byId: mapValues(pipettes, (p: FilePipette, id: string) =>
      createPipette(p, id, TODO_TIPRACK_MODEL))
  }
}

const allReducers = {
  pipettes
}

export default allReducers
