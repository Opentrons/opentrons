// @flow
import {
  ASPIRATE_OFFSET_FROM_BOTTOM_MM,
  blowoutHelper,
  DEFAULT_PIPETTE,
  delayWithOffset,
  DEST_LABWARE,
  dropTipHelper,
  FIXED_TRASH_ID,
  getErrorResult,
  getFlowRateAndOffsetParams,
  getRobotInitialStateNoTipsRemain,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeAspirateHelper,
  makeContext,
  makeDispenseHelper,
  makeTouchTipHelper,
  pickUpTipHelper,
  SOURCE_LABWARE,
} from '../__fixtures__'
import { distribute } from '../commandCreators/compound/distribute'
import type { DistributeArgs } from '../types'

const aspirateHelper = makeAspirateHelper()
const dispenseHelper = makeDispenseHelper()
const touchTipHelper = makeTouchTipHelper()
// TODO: Ian 2019-06-14 more elegant way to test the blowout offset calculation
const BLOWOUT_OFFSET_ANY: any = expect.any(Number)

let mixinArgs
let invariantContext
let robotStateWithTip
let robotInitialStateNoTipsRemain
let blowoutSingleToTrash
let blowoutSingleToSourceA1

beforeEach(() => {
  mixinArgs = {
    ...getFlowRateAndOffsetParams(),
    commandCreatorFnName: 'distribute',
    name: 'distribute test',
    description: 'test blah blah',

    pipette: DEFAULT_PIPETTE,
    sourceLabware: SOURCE_LABWARE,
    destLabware: DEST_LABWARE,

    preWetTip: false,
    touchTipAfterAspirate: false,
    disposalVolume: 60,
    disposalLabware: FIXED_TRASH_ID,
    disposalWell: 'A1',
    mixBeforeAspirate: null,
    aspirateDelay: null,
    dispenseDelay: null,
    aspirateAirGapVolume: null,
    touchTipAfterDispense: false,
  }

  blowoutSingleToTrash = blowoutHelper(FIXED_TRASH_ID, {
    offsetFromBottomMm: BLOWOUT_OFFSET_ANY,
  })
  blowoutSingleToSourceA1 = blowoutHelper(SOURCE_LABWARE, {
    offsetFromBottomMm: BLOWOUT_OFFSET_ANY,
  })

  invariantContext = makeContext()
  robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  robotInitialStateNoTipsRemain = getRobotInitialStateNoTipsRemain(
    invariantContext
  )
})

describe('distribute: minimal example', () => {
  it('single channel; 60uL from A1 -> A2, A3; no tip pickup', () => {
    const distributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip: 'never',
      volume: 60,
    }
    const result = distribute(
      distributeArgs,
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
  it('changeTip: "once"', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'once',
      volume: 90,
    }

    const result = distribute(
      distributeArgs,
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      dropTipHelper('A1'),
      pickUpTipHelper('A1'),
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

  it('changeTip: "always"', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'always',
      volume: 90,
    }

    const result = distribute(
      distributeArgs,
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      dropTipHelper('A1'),
      pickUpTipHelper('A1'),
      aspirateHelper('A1', 240),
      dispenseHelper('A2', 90),
      dispenseHelper('A3', 90),
      blowoutSingleToTrash,

      // next chunk, change tip
      dropTipHelper('A1'),
      pickUpTipHelper('B1'),
      aspirateHelper('A1', 240),
      dispenseHelper('A4', 90),
      dispenseHelper('A5', 90),
      blowoutSingleToTrash,
    ])
  })

  it('changeTip: "never" with carried-over tip', () => {
    // NOTE: this has been used as BASE CASE for the "advanced settings" tests
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 90,
    }
    const result = distribute(
      distributeArgs,
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

  it('changeTip: "never" should fail with no initial tip', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'always',
      volume: 150,
    }

    const result = distribute(
      distributeArgs,
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

describe('advanced settings: volume, mix, pre-wet tip, tip touch, tip position', () => {
  it('should mix before aspirate, then aspirate disposal volume', () => {
    // NOTE this also tests "uneven final chunk" eg A6 in [A2 A3 | A4 A5 | A6]
    // which is especially relevant to disposal volume
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5', 'A6'],
      changeTip: 'never',
      volume: 120,
      mixBeforeAspirate: { times: 2, volume: 50 },
      disposalVolume: 12,
      disposalLabware: SOURCE_LABWARE,
      disposalWell: 'A1',
    }
    const result = distribute(
      distributeArgs,
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)
    const aspirateVol = 120 * 2 + 12
    const mixCommands = [
      // mix 1
      aspirateHelper('A1', 50),
      dispenseHelper('A1', 50, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
      // mix 2
      aspirateHelper('A1', 50),
      dispenseHelper('A1', 50, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
    ]
    expect(res.commands).toEqual([
      ...mixCommands,
      aspirateHelper('A1', aspirateVol),
      dispenseHelper('A2', 120),
      dispenseHelper('A3', 120),
      blowoutSingleToSourceA1,

      ...mixCommands,
      aspirateHelper('A1', aspirateVol),
      dispenseHelper('A4', 120),
      dispenseHelper('A5', 120),
      blowoutSingleToSourceA1,

      ...mixCommands,
      aspirateHelper('A1', 120 + 12),
      dispenseHelper('A6', 120),
      blowoutSingleToSourceA1,
    ])
  })

  // TODO(IL, 2020-02-28): pre-wet volume is not implemented for distribute! #5122
  it.todo('should pre-wet tip')
  // (() => {
  //   const distributeArgs: DistributeArgs = {
  //     ...mixinArgs,
  //     sourceWell: 'A1',
  //     destWells: ['A2', 'A3', 'A4', 'A5'],
  //     changeTip: 'never',
  //     volume: 150,
  //     preWetTip: true,
  //   }
  //   const result = distribute(
  //     distributeArgs,
  //     invariantContext,
  //     robotStateWithTip
  //   )
  //   const res = getSuccessResult(result)

  //   const preWetVolume = 42 // TODO what is pre-wet volume?

  //   const preWetTipCommands = [
  //     aspirateHelper('A1', preWetVolume),
  //     dispenseHelper('A1', preWetVolume, { labware: SOURCE_LABWARE }),
  //   ]

  //   expect(res.commands).toEqual([
  //     ...preWetTipCommands,
  //     aspirateHelper('A1', 300),
  //     dispenseHelper('A2', 150),
  //     dispenseHelper('A3', 150),
  //     blowoutSingleToTrash,
  //     ...preWetTipCommands,
  //     aspirateHelper('A1', 300),
  //     dispenseHelper('A4', 150),
  //     dispenseHelper('A5', 150),
  //     blowoutSingleToTrash,
  //   ])
  // })

  it('should delay after aspirate', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 100,
      aspirateDelay: { seconds: 12, mmFromBottom: 14 },
      // no blowout
      disposalVolume: 0,
    }

    const result = distribute(
      distributeArgs,
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      aspirateHelper('A1', 300),
      ...delayWithOffset('A1', SOURCE_LABWARE),
      dispenseHelper('A2', 100),
      dispenseHelper('A3', 100),
      dispenseHelper('A4', 100),

      aspirateHelper('A1', 100),
      ...delayWithOffset('A1', SOURCE_LABWARE),
      dispenseHelper('A5', 100),
    ])
  })

  it('should touch tip after aspirate', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 90,
      touchTipAfterAspirate: true,
    }
    const result = distribute(
      distributeArgs,
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

  it('should touch tip after dispense', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 90,
      touchTipAfterDispense: true,
    }
    const result = distribute(
      distributeArgs,
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      aspirateHelper('A1', 240),
      dispenseHelper('A2', 90),
      touchTipHelper('A2', { labware: DEST_LABWARE }),
      dispenseHelper('A3', 90),
      touchTipHelper('A3', { labware: DEST_LABWARE }),
      blowoutSingleToTrash,

      aspirateHelper('A1', 240),
      dispenseHelper('A4', 90),
      touchTipHelper('A4', { labware: DEST_LABWARE }),
      dispenseHelper('A5', 90),
      touchTipHelper('A5', { labware: DEST_LABWARE }),
      blowoutSingleToTrash,
    ])
  })

  it('should mix before aspirate w/ disposal vol', () => {
    const volume = 130
    const disposalVolume = 20
    const disposalLabware = SOURCE_LABWARE
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

    const result = distribute(
      distributeArgs,
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)

    const mixCommands = [
      // mix 1
      aspirateHelper('A1', 250),
      dispenseHelper('A1', 250, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
      // mix 2
      aspirateHelper('A1', 250),
      dispenseHelper('A1', 250, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
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

  it('should delay after dispense', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 100,
      dispenseDelay: { seconds: 12, mmFromBottom: 14 },
      // no blowout
      disposalVolume: 0,
    }

    const result = distribute(
      distributeArgs,
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      aspirateHelper('A1', 300),
      dispenseHelper('A2', 100),
      ...delayWithOffset('A2', DEST_LABWARE),
      dispenseHelper('A3', 100),
      ...delayWithOffset('A3', DEST_LABWARE),
      dispenseHelper('A4', 100),
      ...delayWithOffset('A4', DEST_LABWARE),

      aspirateHelper('A1', 100),
      dispenseHelper('A5', 100),
      ...delayWithOffset('A5', DEST_LABWARE),
    ])
  })
})

describe('invalid input + state errors', () => {
  it('invalid pipette ID should throw error', () => {
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip: 'never',
      volume: 100,
      pipette: 'no-such-pipette-id-here',
    }

    const result = distribute(
      distributeArgs,
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
  it(`no disposal volume`, () => {
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
    const result = distribute(
      distributeArgs,
      invariantContext,
      robotStateWithTip
    )
    const res = getErrorResult(result)

    expect(res.errors).toHaveLength(1)
    expect(res.errors[0].type).toEqual('PIPETTE_VOLUME_EXCEEDED')
  })

  it(`with disposal volume`, () => {
    const changeTip = 'once'
    const distributeArgs: DistributeArgs = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip,
      volume: 250,
      disposalVolume: 100,
      disposalLabware: FIXED_TRASH_ID,
      disposalWell: 'A1',
    }
    const result = distribute(
      distributeArgs,
      invariantContext,
      robotStateWithTip
    )
    const res = getErrorResult(result)

    expect(res.errors).toHaveLength(1)
    expect(res.errors[0].type).toEqual('PIPETTE_VOLUME_EXCEEDED')
  })
})
