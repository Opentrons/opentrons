// @flow
import _distribute from '../distribute'
// import merge from 'lodash/merge'
import {createRobotState, commandCreatorNoErrors} from './fixtures' // getTipColumn, getTiprackTipstate, createEmptyLiquidState, commandCreatorHasErrors
import type {DistributeFormData} from '../types'
const distribute = commandCreatorNoErrors(_distribute)
// const distributeWithErrors = commandCreatorHasErrors(_distribute)

let mixinArgs
let robotInitialState
let robotInitialStatePipettesLackTips

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

  robotInitialStatePipettesLackTips = createRobotState({
    sourcePlateType: '96-flat',
    destPlateType: '96-flat',
    tipracks: [200],
    fillPipetteTips: true,
    fillTiprackTips: false
  })
})

describe('distribute single-channel', () => {
  test('minimal distribute: 60uL from A1 -> A2, A3; no tip pickup', () => {
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
        volume: 120,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 60,
        well: 'A2'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 60,
        well: 'A3'
      }
    ])
  })
})

describe('exceeding pipette max', () => {
  test('multiple asp-disp-disp chunks', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'once',
      volume: 150
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A2'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A3'
      },
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A4'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A5'
      }
    ])
  })

  // TODO Ian 2018-05-03 is this a valid distribute?
  // It's gonna be equivalent to a transfer under the hood anyway, right?
  // SKIPPING for now
  // I think this is also an issue with consolidate!
  test.skip('each well exceeds pipette max vol', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip: 'never', // TODO additional test with changeTip='always'
      volume: 350
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A2'
      },
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 50,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 50,
        well: 'A2'
      },
      // A2 done, move to A3
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A3'
      },
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 50,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 50,
        well: 'A3'
      }
    ])
  })

  test('changeTip="always"')
  test('changeTip="never"')
})

describe('changeTip=never with no initial tip returns error', () => {
  // TODO
})
