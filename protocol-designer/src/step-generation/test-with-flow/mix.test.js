// @flow
import flatMap from 'lodash/flatMap'
import _mix from '../commandCreators/compound/mix'
import {
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  commandFixtures as cmd,
} from './fixtures'
import { reduceCommandCreators } from '../utils'
import type { MixArgs } from '../types'

// collapse this compound command creator into the signature of an atomic command creator
const mix = (args: MixArgs) => (invariantContext, initialRobotState) =>
  reduceCommandCreators(_mix(args)(invariantContext, initialRobotState))(
    invariantContext,
    initialRobotState
  )

let invariantContext
let robotStateWithTip
let mixinArgs
let aspirateHelper
let blowoutHelper
let dispenseHelper
let touchTipHelper

beforeEach(() => {
  mixinArgs = {
    commandCreatorFnName: 'mix',
    name: 'mix test',
    description: 'test blah blah',

    pipette: 'p300SingleId',
    labware: 'sourcePlateId',

    blowoutLocation: null,
    touchTip: false,
    touchTipMmFromBottom: 21,

    aspirateFlowRateUlSec: 3,
    blowoutFlowRateUlSec: 4.5,
    dispenseFlowRateUlSec: 4,
    aspirateOffsetFromBottomMm: 2,
    blowoutOffsetFromBottomMm: 22,
    dispenseOffsetFromBottomMm: 1,
  }

  aspirateHelper = (well: string, volume: number) =>
    cmd.aspirate(well, volume, {
      flowRate: mixinArgs.aspirateFlowRateUlSec,
      offsetFromBottomMm: mixinArgs.aspirateOffsetFromBottomMm,
    })

  blowoutHelper = (labwareId: string) =>
    cmd.blowout(labwareId, {
      flowRate: mixinArgs.blowoutFlowRateUlSec,
      offsetFromBottomMm: mixinArgs.blowoutOffsetFromBottomMm,
    })

  dispenseHelper = (well: string, volume: number) =>
    cmd.dispense(well, volume, {
      flowRate: mixinArgs.dispenseFlowRateUlSec,
      offsetFromBottomMm: mixinArgs.dispenseOffsetFromBottomMm,
    })

  touchTipHelper = (well: string) =>
    cmd.touchTip(well, {
      offsetFromBottomMm: mixinArgs.touchTipMmFromBottom,
    })

  invariantContext = makeContext()
  robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
})

describe('mix: change tip', () => {
  const volume = 5
  const times = 2
  const makeArgs = (changeTip): MixArgs => ({
    ...mixinArgs,
    volume,
    times,
    wells: ['A1', 'B1', 'C1'],
    changeTip,
  })
  test('changeTip="always"', () => {
    const args = makeArgs('always')
    const result = mix(args)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well: string, idx: number) => [
        ...cmd.replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
      ])
    )
  })

  test('changeTip="once"', () => {
    const args = makeArgs('once')
    const result = mix(args)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      ...cmd.replaceTipCommands(0),
      ...flatMap(args.wells, well => [
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
      ]),
    ])
  })

  test('changeTip="never"', () => {
    const args = makeArgs('never')
    const result = mix(args)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, well => [
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
      ])
    )
  })
})

describe('mix: advanced options', () => {
  const volume = 8
  const times = 2
  const blowoutLabwareId = 'destPlateId'

  test('flow rate', () => {
    const ASPIRATE_OFFSET = 11
    const DISPENSE_OFFSET = 12
    const BLOWOUT_OFFSET = 13
    const ASPIRATE_FLOW_RATE = 3
    const DISPENSE_FLOW_RATE = 6
    const BLOWOUT_FLOW_RATE = 9
    const args: MixArgs = {
      ...mixinArgs,
      volume,
      times,
      wells: ['A1'],
      changeTip: 'once',
      aspirateOffsetFromBottomMm: ASPIRATE_OFFSET,
      blowoutOffsetFromBottomMm: BLOWOUT_OFFSET,
      dispenseOffsetFromBottomMm: DISPENSE_OFFSET,
      aspirateFlowRateUlSec: ASPIRATE_FLOW_RATE,
      blowoutFlowRateUlSec: BLOWOUT_FLOW_RATE,
      dispenseFlowRateUlSec: DISPENSE_FLOW_RATE,
    }

    const aspirateParams = {
      flowRate: ASPIRATE_FLOW_RATE,
      offsetFromBottomMm: ASPIRATE_OFFSET,
    }
    const dispenseParams = {
      flowRate: DISPENSE_FLOW_RATE,
      offsetFromBottomMm: DISPENSE_OFFSET,
    }

    const result = mix(args)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      ...cmd.replaceTipCommands(0),
      { ...cmd.aspirate('A1', volume, aspirateParams) },
      { ...cmd.dispense('A1', volume, dispenseParams) },

      { ...cmd.aspirate('A1', volume, aspirateParams) },
      { ...cmd.dispense('A1', volume, dispenseParams) },
    ])
  })

  test('touch tip (after each dispense)', () => {
    const args: MixArgs = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      touchTip: true,
      wells: ['A1', 'B1', 'C1'],
    }

    const result = mix(args)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...cmd.replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        touchTipHelper(well),
      ])
    )
  })

  test('blowout', () => {
    const args: MixArgs = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      blowoutLocation: blowoutLabwareId,
      wells: ['A1', 'B1', 'C1'],
    }

    const result = mix(args)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...cmd.replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        blowoutHelper(blowoutLabwareId),
      ])
    )
  })

  test('touch tip after blowout', () => {
    const args: MixArgs = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      blowoutLocation: blowoutLabwareId,
      touchTip: true,
      wells: ['A1', 'B1', 'C1'],
    }

    const result = mix(args)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...cmd.replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        blowoutHelper(blowoutLabwareId),
        touchTipHelper(well),
      ])
    )
  })
})

describe('mix: errors', () => {
  let errorArgs = {}
  beforeEach(() => {
    errorArgs = {
      ...mixinArgs,
      volume: 8,
      times: 2,
      changeTip: 'once',
      wells: ['A1', 'A2'],
    }
  })
  test('invalid labware', () => {
    const args: MixArgs = {
      ...errorArgs,
      labware: 'invalidLabwareId',
    }
    const result = mix(args)(invariantContext, robotStateWithTip)
    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  test('invalid pipette', () => {
    const args: MixArgs = {
      ...errorArgs,
      pipette: 'invalidPipetteId',
    }
    const result = mix(args)(invariantContext, robotStateWithTip)
    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'PIPETTE_DOES_NOT_EXIST',
    })
  })

  // TODO Ian 2018-05-08
  test.skip('"times" arg non-integer', () => {})
  test.skip('"times" arg negative', () => {})
})
