// @flow
import {
  getRobotInitialStateNoTipsRemain,
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  commandFixtures as cmd,
} from './fixtures'
import { reduceCommandCreators } from '../utils'
import _distribute from '../commandCreators/compound/distribute'
import type { DistributeArgs } from '../types'

// collapse this compound command creator into the signature of an atomic command creator
const distribute = (args: DistributeArgs) => (
  invariantContext,
  initialRobotState
) =>
  reduceCommandCreators(_distribute(args)(invariantContext, initialRobotState))(
    invariantContext,
    initialRobotState
  )

// TODO IMMEDIATELY: this is duplicated in consolidate and probably distribute
// NOTE: make sure none of these numbers match!
const ASPIRATE_FLOW_RATE = 2.1
const DISPENSE_FLOW_RATE = 2.2
const BLOWOUT_FLOW_RATE = 2.3

const ASPIRATE_OFFSET_FROM_BOTTOM_MM = 3.1
const DISPENSE_OFFSET_FROM_BOTTOM_MM = 3.2
const BLOWOUT_OFFSET_FROM_BOTTOM_MM = 3.3
const TOUCH_TIP_OFFSET_FROM_BOTTOM_MM = 3.4

const aspirateHelper = (well: string, volume: number, params = null) =>
  cmd.aspirate(well, volume, {
    offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
    flowRate: ASPIRATE_FLOW_RATE,
    ...params,
  })

const dispenseHelper = (well, volume, params = null) =>
  cmd.dispense(well, volume, {
    labware: 'destPlateId', // TODO IMMEDIATELY: watch this value
    offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
    flowRate: DISPENSE_FLOW_RATE,
    ...params,
  })

// TODO IMMEDIATELY: THIS IS NEW vs CONSOLIDATE
const touchTipHelper = (well, params) =>
  cmd.touchTip(well, {
    offsetFromBottomMm: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
    ...params,
  })

const blowoutHelper = (labware: string | typeof undefined, params) =>
  cmd.blowout(labware, {
    offsetFromBottomMm: BLOWOUT_OFFSET_FROM_BOTTOM_MM,
    flowRate: BLOWOUT_FLOW_RATE,
    ...params,
  })

let mixinArgs
let invariantContext
let robotStateWithTip
let robotInitialStateNoTipsRemain
let blowoutSingleToTrash
let blowoutSingleToSourceA1
let flowRatesAndOffsets

beforeEach(() => {
  flowRatesAndOffsets = {
    aspirateFlowRateUlSec: ASPIRATE_FLOW_RATE,
    dispenseFlowRateUlSec: DISPENSE_FLOW_RATE,
    blowoutFlowRateUlSec: BLOWOUT_FLOW_RATE,
    aspirateOffsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
    dispenseOffsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
    blowoutOffsetFromBottomMm: BLOWOUT_OFFSET_FROM_BOTTOM_MM,
    touchTipAfterAspirateOffsetMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
    touchTipAfterDispenseOffsetMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
  }

  // TODO IMMEDIATELY call this var the same thing in transfer/consolidate/distribute
  mixinArgs = {
    ...flowRatesAndOffsets,
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

  blowoutSingleToTrash = blowoutHelper('trashId')
  blowoutSingleToSourceA1 = blowoutHelper('sourcePlateId', { well: 'A1' })

  invariantContext = makeContext()
  robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  robotInitialStateNoTipsRemain = getRobotInitialStateNoTipsRemain(
    invariantContext
  )
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
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      aspirateHelper('A1', 180),
      dispenseHelper('A2', 60),
      dispenseHelper('A3', 60),
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
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),
      aspirateHelper('A1', 240),
      dispenseHelper('A2', 90),
      dispenseHelper('A3', 90),
      blowoutSingleToTrash,

      aspirateHelper('A1', 240),
      dispenseHelper('A4', 90),
      dispenseHelper('A5', 90),

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
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),
      aspirateHelper('A1', 240),
      dispenseHelper('A2', 90),
      dispenseHelper('A3', 90),
      blowoutSingleToTrash,

      // next chunk, change tip
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),
      aspirateHelper('A1', 240),
      dispenseHelper('A4', 90),
      dispenseHelper('A5', 90),
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
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      aspirateHelper('A1', 240),
      dispenseHelper('A2', 90),
      dispenseHelper('A3', 90),
      blowoutSingleToTrash,
      aspirateHelper('A1', 240),
      dispenseHelper('A4', 90),
      dispenseHelper('A5', 90),
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

    const result = distribute(distributeArgs)(
      invariantContext,
      robotInitialStateNoTipsRemain
    )
    const res = getErrorResult(result)

    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
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
    const res = getSuccessResult(result)
    const aspirateVol = 120 * 2 + 12

    expect(res.commands).toEqual([
      aspirateHelper('A1', aspirateVol),
      dispenseHelper('A2', 120),
      dispenseHelper('A3', 120),
      blowoutSingleToSourceA1,

      aspirateHelper('A1', aspirateVol),
      dispenseHelper('A4', 120),
      dispenseHelper('A5', 120),
      blowoutSingleToSourceA1,

      aspirateHelper('A1', 120 + 12),
      dispenseHelper('A6', 120),
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
    const res = getSuccessResult(result)

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

    expect(res.commands).toEqual([
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
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      aspirateHelper('A1', 240),
      touchTipHelper('A1'),
      dispenseHelper('A2', 90),
      dispenseHelper('A3', 90),
      blowoutSingleToTrash,

      aspirateHelper('A1', 240),
      touchTipHelper('A1'),
      dispenseHelper('A4', 90),
      dispenseHelper('A5', 90),
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
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      aspirateHelper('A1', 240),
      dispenseHelper('A2', 90),
      touchTipHelper('A2', { labware: 'destPlateId' }),
      dispenseHelper('A3', 90),
      touchTipHelper('A3', { labware: 'destPlateId' }),
      blowoutSingleToTrash,

      aspirateHelper('A1', 240),
      dispenseHelper('A4', 90),
      touchTipHelper('A4', { labware: 'destPlateId' }),
      dispenseHelper('A5', 90),
      touchTipHelper('A5', { labware: 'destPlateId' }),
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
    const res = getSuccessResult(result)

    const mixCommands = [
      // mix 1
      aspirateHelper('A1', 250),
      dispenseHelper('A1', 250, { labware: 'sourcePlateId' }),
      // mix 2
      aspirateHelper('A1', 250),
      dispenseHelper('A1', 250, { labware: 'sourcePlateId' }),
    ]

    expect(res.commands).toEqual([
      ...mixCommands,
      aspirateHelper('A1', aspirateVol),
      dispenseHelper('A2', volume),
      dispenseHelper('A3', volume),
      blowoutSingleToSourceA1,

      ...mixCommands,
      aspirateHelper('A1', aspirateVol),
      dispenseHelper('A4', volume),
      dispenseHelper('A5', volume),
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

    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )
    const res = getErrorResult(result)

    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
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
    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )
    const res = getErrorResult(result)

    expect(res.errors).toHaveLength(1)
    expect(res.errors[0].type).toEqual('PIPETTE_VOLUME_EXCEEDED')
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
    const result = distribute(distributeArgs)(
      invariantContext,
      robotStateWithTip
    )
    const res = getErrorResult(result)

    expect(res.errors).toHaveLength(1)
    expect(res.errors[0].type).toEqual('PIPETTE_VOLUME_EXCEEDED')
  })
})
