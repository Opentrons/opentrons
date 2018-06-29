// @flow
import mapValues from 'lodash/mapValues'

import {getPipette} from '@opentrons/shared-data'

import type {FilePipette, ProtocolFile} from '../../file-types'
import type {PipetteReducerState} from '../../pipettes/reducers'
import type {PipetteData} from '../../step-generation'

// TODO IMMEDIATELY have space in file for pipette tiprack type
const TODO_TIPRACK_MODEL = 'tiprack-10ul'

function createPipette (p: FilePipette, id: string, tiprackModel: string): PipetteData {
  const pipetteData = getPipette(p.model)
  if (!pipetteData) {
    // TODO Ian 2018-03-01 I want Flow to enforce `name` is a key in pipetteDataByName,
    // but it doesn't seem to want to be strict about it
    throw new Error('Invalid pipette name, no entry in pipetteDataByName')
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
