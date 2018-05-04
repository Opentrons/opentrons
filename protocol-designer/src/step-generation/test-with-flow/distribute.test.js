// @flow
import _distribute from '../distribute'
// import merge from 'lodash/merge'
import {createRobotState, commandCreatorNoErrors, commandCreatorHasErrors} from './fixtures'
import type {DistributeFormData} from '../types'
const distribute = commandCreatorNoErrors(_distribute)
const distributeWithErrors = commandCreatorHasErrors(_distribute)

let mixinArgs
let robotInitialState
let robotInitialStatePipettesLackTips
let dropTipSingleChannel
let blowoutSingleToDestPlateA1

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
    delayAfterDispense: null,
    // NOTE: setting "blowout to dest plate" in standard args for these tests to make sure
    // we're not just blowing out to trashId and ignoring the given blowout labware
    blowout: 'destPlateId'
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

  dropTipSingleChannel = {
    command: 'drop-tip',
    pipette: 'p300SingleId',
    labware: 'trashId',
    well: 'A1'
  }

  blowoutSingleToDestPlateA1 = {
    command: 'blowout',
    pipette: 'p300SingleId',
    labware: mixinArgs.blowout,
    well: 'A1'
  }
})

describe('distribute: minimal example', () => {
  test('single channel; 60uL from A1 -> A2, A3; no tip pickup', () => {
    // TODO Ian 2018-05-03 distributeArgs needs to be typed because the
    // commandCreatorNoErrors wrapper casts the arg type to any :(
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip: 'never',
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
      },
      blowoutSingleToDestPlateA1
    ])
  })
})

describe('tip handling for multiple distribute chunks', () => {
  test('changeTip: "once"', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'once',
      volume: 150
    }

    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      dropTipSingleChannel,
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
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
        well: 'A2'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A3'
      },
      blowoutSingleToDestPlateA1,

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
      },
      blowoutSingleToDestPlateA1
    ])
  })

  test('changeTip: "always"', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'always',
      volume: 150
    }

    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      dropTipSingleChannel,
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
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
        well: 'A2'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A3'
      },
      blowoutSingleToDestPlateA1,

      // next chunk, change tip
      dropTipSingleChannel,
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'B1'
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
      },
      blowoutSingleToDestPlateA1
    ])
  })

  test('changeTip: "never" with carried-over tip', () => {
    // NOTE: this has been used as BASE CASE for the "advanced settings" tests
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
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
      blowoutSingleToDestPlateA1,
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
      },
      blowoutSingleToDestPlateA1
    ])
  })

  test('changeTip: "never" should fail with no initial tip', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'always',
      volume: 150
    }

    const result = distributeWithErrors(distributeArgs)(robotInitialStatePipettesLackTips)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'INSUFFICIENT_TIPS'
    })
  })
})

describe('advanced settings: disposal volume, mix, pre-wet tip, tip touch', () => {
  test('mix before aspirate, then aspirate disposal volume', () => {
    // NOTE this also tests "uneven final chunk" eg A6 in [A2 A3 | A4 A5 | A6]
    // which is especially relevant to disposal volume
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5', 'A6'],
      changeTip: 'never',
      volume: 120,

      mixFirstAspirate: true,
      disposalVolume: 12
    }
    const result = distribute(distributeArgs)(robotInitialState)
    const aspirateVol = (120 * 2) + 12

    expect(result.commands).toEqual([
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: aspirateVol,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 120,
        well: 'A2'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 120,
        well: 'A3'
      },
      blowoutSingleToDestPlateA1,
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: aspirateVol,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 120,
        well: 'A4'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 120,
        well: 'A5'
      },
      blowoutSingleToDestPlateA1,
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 120 + 12,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 120,
        well: 'A6'
      },
      blowoutSingleToDestPlateA1
    ])
  })

  test.skip('pre-wet tip', () => {
    // TODO Ian 2018-05-04 pre-wet volume is TBD.
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 150,
      preWetTip: true
    }
    const result = distribute(distributeArgs)(robotInitialState)

    const preWetVolume = 42 // TODO what is pre-wet volume?
    const preWetTipCommands = [
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: preWetVolume,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: preWetVolume,
        well: 'A1'
      }
    ]

    expect(result.commands).toEqual([
      ...preWetTipCommands,
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
      blowoutSingleToDestPlateA1,
      ...preWetTipCommands,
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
      },
      blowoutSingleToDestPlateA1
    ])
  })

  test('touch tip after aspirate', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 150,
      touchTipAfterAspirate: true
    }
    const result = distribute(distributeArgs)(robotInitialState)
    const touchTipCommand = {
      command: 'touch-tip',
      labware: 'sourcePlateId',
      pipette: 'p300SingleId',
      well: 'A1'
    }

    expect(result.commands).toEqual([
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1'
      },
      touchTipCommand,
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
      blowoutSingleToDestPlateA1,
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1'
      },
      touchTipCommand,
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
      },
      blowoutSingleToDestPlateA1
    ])
  })

  test('touch tip after dispense', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 150,
      touchTipAfterDispense: true
    }
    const result = distribute(distributeArgs)(robotInitialState)

    function makeTouchTip (well: string) {
      return {
        command: 'touch-tip',
        pipette: 'p300SingleId',
        labware: 'destPlateId',
        well
      }
    }

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
      makeTouchTip('A2'),
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A3'
      },
      makeTouchTip('A3'),
      blowoutSingleToDestPlateA1,
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
      makeTouchTip('A4'),
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A5'
      },
      makeTouchTip('A5'),
      blowoutSingleToDestPlateA1
    ])
  })

  test('mix before aspirate') // TODO IMMEDIATELY
})

describe('weirdos TBD', () => {
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
      volume: 350,
      blowout: null
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
})
