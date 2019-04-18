// @flow
import _distribute from '../commandCreators/compound/distribute'
// import merge from 'lodash/merge'
import {
  makeContext,
  makeState,
  compoundCommandCreatorNoErrors,
  compoundCommandCreatorHasErrors,
  commandFixtures as cmd,
} from './fixtures'
import type { DistributeArgs } from '../types'
const distribute = compoundCommandCreatorNoErrors(_distribute)
const distributeWithErrors = compoundCommandCreatorHasErrors(_distribute)

// shorthand
const dispense = (well, volume) =>
  cmd.dispense(well, volume, { labware: 'destPlateId' })

let mixinArgs
let invariantContext
let robotStateWithTip
let robotInitialStateNoTipsRemain
let blowoutSingleToTrash
let blowoutSingleToSourceA1

beforeEach(() => {
  mixinArgs = {
    commandCreatorFnName: 'distribute',
    name: 'distribute test',
    description: 'test blah blah',

    pipette: 'p300SingleId',
    sourceLabware: 'sourcePlateId',
    destLabware: 'destPlateId',

    preWetTip: false,
    touchTipAfterAspirate: false,
    disposalVolume: 60,
    disposalLabware: 'trashId',
    disposalWell: 'A1',
    mixBeforeAspirate: null,

    touchTipAfterDispense: false,
  }

  blowoutSingleToTrash = cmd.blowout('trashId')
  blowoutSingleToSourceA1 = cmd.blowout('sourcePlateId', { well: 'A1' })

  // TODO IMMEDIATELY this invariantContext/initialRobotState/robotStateWithTip is repeated in aspirate.test.js -- make a fixture helper?
  // NOTE: this one is different, no initialRobotState, always want tips
  invariantContext = makeContext()
  const makeStateArgs = {
    invariantContext,
    pipetteLocations: { p300SingleId: { mount: 'left' } },
    labwareLocations: {
      tiprack1Id: { slot: '1' },
      sourcePlateId: { slot: '2' },
      destPlateId: { slot: '3' },
      trashId: { slot: '12' },
    },
  }
  robotStateWithTip = makeState({
    ...makeStateArgs,
    tiprackSetting: { tiprack1Id: true },
  })
  robotStateWithTip.tipState.pipettes.p300SingleId = true

  robotInitialStateNoTipsRemain = makeState({
    ...makeStateArgs,
    tiprackSetting: { tiprack1Id: false },
  })
})

describe('distribute: minimal example', () => {
  test('single channel; 60uL from A1 -> A2, A3; no tip pickup', () => {
    // TODO Ian 2018-05-03 distributeArgs needs to be typed because the
    // commandCreatorNoErrors wrapper casts the arg type to any :(
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip: 'never',
      volume: 60,
    }
    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 180),
      dispense('A2', 60),
      dispense('A3', 60),
      blowoutSingleToTrash,
    ])
  })
})

describe('tip handling for multiple distribute chunks', () => {
  test('changeTip: "once"', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'once',
      volume: 90,
    }

    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

    expect(result.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 240),
      dispense('A2', 90),
      dispense('A3', 90),
      blowoutSingleToTrash,

      cmd.aspirate('A1', 240),
      dispense('A4', 90),
      dispense('A5', 90),

      blowoutSingleToTrash,
    ])
  })

  test('changeTip: "always"', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'always',
      volume: 90,
    }

    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

    expect(result.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 240),
      dispense('A2', 90),
      dispense('A3', 90),
      blowoutSingleToTrash,

      // next chunk, change tip
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),
      cmd.aspirate('A1', 240),
      dispense('A4', 90),
      dispense('A5', 90),
      blowoutSingleToTrash,
    ])
  })

  test('changeTip: "never" with carried-over tip', () => {
    // NOTE: this has been used as BASE CASE for the "advanced settings" tests
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 90,
    }
    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 240),
      dispense('A2', 90),
      dispense('A3', 90),
      blowoutSingleToTrash,
      cmd.aspirate('A1', 240),
      dispense('A4', 90),
      dispense('A5', 90),
      blowoutSingleToTrash,
    ])
  })

  test('changeTip: "never" should fail with no initial tip', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'always',
      volume: 150,
    }

    const result = distributeWithErrors(distributeArgs)(
      invariantContext,
      robotInitialStateNoTipsRemain
    )

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'INSUFFICIENT_TIPS',
    })
  })
})

describe('advanced settings: volume, mix, pre-wet tip, tip touch', () => {
  test('mix before aspirate, then aspirate disposal volume', () => {
    // NOTE this also tests "uneven final chunk" eg A6 in [A2 A3 | A4 A5 | A6]
    // which is especially relevant to disposal volume
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5', 'A6'],
      changeTip: 'never',
      volume: 120,

      mixFirstAspirate: true,
      disposalVolume: 12,
      disposalLabware: 'sourcePlateId',
      disposalWell: 'A1',
    }
    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )
    const aspirateVol = 120 * 2 + 12

    expect(result.commands).toEqual([
      cmd.aspirate('A1', aspirateVol),
      dispense('A2', 120),
      dispense('A3', 120),
      blowoutSingleToSourceA1,

      cmd.aspirate('A1', aspirateVol),
      dispense('A4', 120),
      dispense('A5', 120),
      blowoutSingleToSourceA1,

      cmd.aspirate('A1', 120 + 12),
      dispense('A6', 120),
      blowoutSingleToSourceA1,
    ])
  })

  test.skip('pre-wet tip', () => {
    // TODO Ian 2018-05-04 pre-wet volume is TBD.
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 150,
      preWetTip: true,
    }
    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

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
      blowoutSingleToTrash,
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
      blowoutSingleToTrash,
    ])
  })

  test('touch tip after aspirate', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 90,
      touchTipAfterAspirate: true,
    }
    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 240),
      cmd.touchTip('A1'),
      dispense('A2', 90),
      dispense('A3', 90),
      blowoutSingleToTrash,

      cmd.aspirate('A1', 240),
      cmd.touchTip('A1'),
      dispense('A4', 90),
      dispense('A5', 90),
      blowoutSingleToTrash,
    ])
  })

  test('touch tip after dispense', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 90,
      touchTipAfterDispense: true,
    }
    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

    function touchTip(well: string) {
      return cmd.touchTip(well, { labware: 'destPlateId' })
    }

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 240),
      dispense('A2', 90),
      touchTip('A2'),
      dispense('A3', 90),
      touchTip('A3'),
      blowoutSingleToTrash,

      cmd.aspirate('A1', 240),
      dispense('A4', 90),
      touchTip('A4'),
      dispense('A5', 90),
      touchTip('A5'),
      blowoutSingleToTrash,
    ])
  })

  test('mix before aspirate w/ disposal vol', () => {
    const volume = 130
    const disposalVolume = 20
    const disposalLabware = 'sourcePlateId'
    const disposalWell = 'A1'
    const aspirateVol = volume * 2 + disposalVolume
    const distributeArgs: DistributeArgs = {
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
      disposalLabware,
      disposalWell,
    }

    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

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
      blowoutSingleToSourceA1,

      ...mixCommands,
      cmd.aspirate('A1', aspirateVol),
      dispense('A4', volume),
      dispense('A5', volume),
      blowoutSingleToSourceA1,
    ])
  })
})

describe('invalid input + state errors', () => {
  test('invalid pipette ID should throw error', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip: 'never',
      volume: 100,
      pipette: 'no-such-pipette-id-here',
    }

    const result = distributeWithErrors(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'PIPETTE_DOES_NOT_EXIST',
    })
  })
})

describe('distribute volume exceeds pipette max volume', () => {
  test(`no disposal volume`, () => {
    const changeTip = 'once'
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip,
      volume: 350,
      disposalVolume: null,
      disposalLabware: null,
      disposalWell: null,
    }
    const result = distributeWithErrors(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].type).toEqual('PIPETTE_VOLUME_EXCEEDED')
  })

  test(`with disposal volume`, () => {
    const changeTip = 'once'
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip,
      volume: 250,
      disposalVolume: 100,
      disposalLabware: 'trashId',
      disposalWell: 'A1',
    }
    const result = distributeWithErrors(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].type).toEqual('PIPETTE_VOLUME_EXCEEDED')
  })
})
