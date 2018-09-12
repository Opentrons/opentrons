// @flow
import _distribute from '../distribute'
// import merge from 'lodash/merge'
import {
  createRobotState,
  commandCreatorNoErrors,
  commandCreatorHasErrors,
  commandFixtures as cmd,
} from './fixtures'
import type {DistributeFormData} from '../types'
const distribute = commandCreatorNoErrors(_distribute)
const distributeWithErrors = commandCreatorHasErrors(_distribute)

// shorthand
const dispense = (well, volume) =>
  cmd.dispense(well, volume, {labware: 'destPlateId'})

let mixinArgs
let robotInitialState
let robotInitialStatePipettesLackTips
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
    blowout: 'destPlateId',
  }

  robotInitialState = createRobotState({
    sourcePlateType: '96-flat',
    destPlateType: '96-flat',
    tipracks: [200],
    fillPipetteTips: true,
    fillTiprackTips: true,
  })

  robotInitialStatePipettesLackTips = createRobotState({
    sourcePlateType: '96-flat',
    destPlateType: '96-flat',
    tipracks: [200],
    fillPipetteTips: true,
    fillTiprackTips: false,
  })

  blowoutSingleToDestPlateA1 = cmd.blowout(mixinArgs.blowout)
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
      volume: 60,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 120),
      dispense('A2', 60),
      dispense('A3', 60),
      blowoutSingleToDestPlateA1,
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
      volume: 150,
    }

    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 300),
      dispense('A2', 150),
      dispense('A3', 150),
      blowoutSingleToDestPlateA1,

      cmd.aspirate('A1', 300),
      dispense('A4', 150),
      dispense('A5', 150),

      blowoutSingleToDestPlateA1,
    ])
  })

  test('changeTip: "always"', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'always',
      volume: 150,
    }

    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 300),
      dispense('A2', 150),
      dispense('A3', 150),
      blowoutSingleToDestPlateA1,

      // next chunk, change tip
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),
      cmd.aspirate('A1', 300),
      dispense('A4', 150),
      dispense('A5', 150),
      blowoutSingleToDestPlateA1,
    ])
  })

  test('changeTip: "never" with carried-over tip', () => {
    // NOTE: this has been used as BASE CASE for the "advanced settings" tests
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 150,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 300),
      dispense('A2', 150),
      dispense('A3', 150),
      blowoutSingleToDestPlateA1,
      cmd.aspirate('A1', 300),
      dispense('A4', 150),
      dispense('A5', 150),
      blowoutSingleToDestPlateA1,
    ])
  })

  test('changeTip: "never" should fail with no initial tip', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'always',
      volume: 150,
    }

    const result = distributeWithErrors(distributeArgs)(robotInitialStatePipettesLackTips)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'INSUFFICIENT_TIPS',
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
      disposalVolume: 12,
    }
    const result = distribute(distributeArgs)(robotInitialState)
    const aspirateVol = (120 * 2) + 12

    expect(result.commands).toEqual([
      cmd.aspirate('A1', aspirateVol),
      dispense('A2', 120),
      dispense('A3', 120),
      blowoutSingleToDestPlateA1,

      cmd.aspirate('A1', aspirateVol),
      dispense('A4', 120),
      dispense('A5', 120),
      blowoutSingleToDestPlateA1,

      cmd.aspirate('A1', 120 + 12),
      dispense('A6', 120),
      blowoutSingleToDestPlateA1,
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
      preWetTip: true,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    const preWetVolume = 42 // TODO what is pre-wet volume?
    const preWetTipCommands = [
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: preWetVolume,
        well: 'A1',
      },
      {
        command: 'dispense',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: preWetVolume,
        well: 'A1',
      },
    ]

    expect(result.commands).toEqual([
      ...preWetTipCommands,
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1',
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A2',
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A3',
      },
      blowoutSingleToDestPlateA1,
      ...preWetTipCommands,
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1',
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A4',
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A5',
      },
      blowoutSingleToDestPlateA1,
    ])
  })

  test('touch tip after aspirate', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 150,
      touchTipAfterAspirate: true,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 300),
      cmd.touchTip('A1'),
      dispense('A2', 150),
      dispense('A3', 150),
      blowoutSingleToDestPlateA1,

      cmd.aspirate('A1', 300),
      cmd.touchTip('A1'),
      dispense('A4', 150),
      dispense('A5', 150),
      blowoutSingleToDestPlateA1,
    ])
  })

  test('touch tip after dispense', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 150,
      touchTipAfterDispense: true,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    function touchTip (well: string) {
      return cmd.touchTip(well, {labware: 'destPlateId'})
    }

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 300),
      dispense('A2', 150),
      touchTip('A2'),
      dispense('A3', 150),
      touchTip('A3'),
      blowoutSingleToDestPlateA1,

      cmd.aspirate('A1', 300),
      dispense('A4', 150),
      touchTip('A4'),
      dispense('A5', 150),
      touchTip('A5'),
      blowoutSingleToDestPlateA1,
    ])
  })

  test('mix before aspirate w/ disposal vol', () => {
    const volume = 130
    const disposalVolume = 20
    const aspirateVol = (volume * 2) + disposalVolume
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume,
      mixBeforeAspirate: {
        volume: 250,
        times: 2,
      },
      disposalVolume,
    }

    const result = distribute(distributeArgs)(robotInitialState)

    const mixCommands = [
      // mix 1
      cmd.aspirate('A1', 250),
      cmd.dispense('A1', 250), // dispense to sourcePlateId
      // mix 2
      cmd.aspirate('A1', 250),
      cmd.dispense('A1', 250), // dispense to sourcePlateId
    ]

    expect(result.commands).toEqual([
      ...mixCommands,
      cmd.aspirate('A1', aspirateVol),
      dispense('A2', volume),
      dispense('A3', volume),
      blowoutSingleToDestPlateA1,

      ...mixCommands,
      cmd.aspirate('A1', aspirateVol),
      dispense('A4', volume),
      dispense('A5', volume),
      blowoutSingleToDestPlateA1,
    ])
  })
})

describe('invalid input + state errors', () => {
  test('invalid pipette ID should throw error', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip: 'never',
      volume: 100,
      pipette: 'no-such-pipette-id-here',
    }

    const result = distributeWithErrors(distributeArgs)(robotInitialState)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'PIPETTE_DOES_NOT_EXIST',
    })
  })
})

describe('distribute volume exceeds pipette max volume', () => {
  test(`change tip: always`, () => {
    const changeTip = 'always'
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip,
      volume: 350,
      blowout: null, // TODO additional test with blowout
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),

      cmd.aspirate('A1', 300),
      dispense('A2', 300),

      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      cmd.aspirate('A1', 50),
      dispense('A2', 50),

      // A2 done, move to A3
      cmd.dropTip('A1'),
      cmd.pickUpTip('C1'),

      cmd.aspirate('A1', 300),
      dispense('A3', 300),

      cmd.dropTip('A1'),
      cmd.pickUpTip('D1'),

      cmd.aspirate('A1', 50),
      dispense('A3', 50),
    ])
  })

  test(`change tip: once`, () => {
    const changeTip = 'once'
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip,
      volume: 350,
      blowout: null, // TODO additional test with blowout
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),

      cmd.aspirate('A1', 300),
      dispense('A2', 300),
      cmd.aspirate('A1', 50),
      dispense('A2', 50),

      // A2 done, move to A3
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      cmd.aspirate('A1', 300),
      dispense('A3', 300),
      cmd.aspirate('A1', 50),
      dispense('A3', 50),
    ])
  })

  test(`change tip: never`, () => {
    const changeTip = 'never'
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip,
      volume: 350,
      blowout: null, // TODO additional test with blowout
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 300),
      dispense('A2', 300),
      cmd.aspirate('A1', 50),
      dispense('A2', 50),

      // A2 done, move to A3
      cmd.aspirate('A1', 300),
      dispense('A3', 300),
      cmd.aspirate('A1', 50),
      dispense('A3', 50),
    ])
  })
})
