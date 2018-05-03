// @flow
import _distribute from '../distribute'
// import merge from 'lodash/merge'
import {createRobotState, commandCreatorNoErrors} from './fixtures' // getTipColumn, getTiprackTipstate, createEmptyLiquidState, commandCreatorHasErrors
import type {DistributeFormData} from '../types'
const distribute = commandCreatorNoErrors(_distribute)
// const distributeWithErrors = commandCreatorHasErrors(_distribute)

let mixinArgs
let robotInitialState

beforeEach(() => {
  mixinArgs = {
    stepType: 'distribute',
    name: 'distribute test',
    description: 'test blah blah',
    pipette: 'p300SingleId',

    sourceLabware: 'sourcePlateId',
    destLabware: 'destPlateId',

    preWetTip: false,
    touchTipAfterAspirate: false,
    disposalVolume: null,
    mixBeforeAspirate: null,

    touchTipAfterDispense: false,
    // mixInDestination: null, // SHOULD NOT BE IN FORM DATA
    delayAfterDispense: null,
    blowout: null
  }

  robotInitialState = createRobotState({
    sourcePlateType: '96-flat',
    destPlateType: '96-flat',
    tipracks: [200],
    fillPipetteTips: true,
    fillTiprackTips: true
  })
})

describe('distribute single-channel', () => {
  test('minimal distribute: 60uL from A1 -> A2, A3', () => {
    // TODO Ian 2018-05-03 distributeArgs needs to be typed because the
    // commandCreatorNoErrors wrapper casts the arg type to any :(
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip: 'once',
      volume: 60
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 60,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 30,
        well: 'A2'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 30,
        well: 'A3'
      }
    ])
  })
})

describe('distribute exceeding pipette max', () => {
  // TODO Ian 2018-05-03
})
