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
import {
  getFlowRateAndOffsetParams,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
  makeAspirateHelper,
  makeDispenseHelper,
  blowoutHelper,
  touchTipHelper,
} from './fixtures/commandFixtures'
import { reduceCommandCreators } from '../utils'
import type { MixArgs } from '../types'

const aspirateHelper = makeAspirateHelper()
const dispenseHelper = makeDispenseHelper({ labware: SOURCE_LABWARE })

// collapse this compound command creator into the signature of an atomic command creator
const mix = (args: MixArgs) => (invariantContext, initialRobotState) =>
  reduceCommandCreators(_mix(args)(invariantContext, initialRobotState))(
    invariantContext,
    initialRobotState
  )

let invariantContext
let robotStateWithTip
let mixinArgs

beforeEach(() => {
  mixinArgs = {
    commandCreatorFnName: 'mix',
    name: 'mix test',
    description: 'test blah blah',

    pipette: DEFAULT_PIPETTE,
    labware: SOURCE_LABWARE,

    blowoutLocation: null,
    touchTip: false,
    ...getFlowRateAndOffsetParams(),
  }

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
  const blowoutLabwareId = DEST_LABWARE

  test('flow rate', () => {
    const args = {
      ...mixinArgs,
      volume,
      times,
      wells: ['A1'],
      changeTip: 'once',
      ...getFlowRateAndOffsetParams(),
    }

    const result = mix(args)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      ...cmd.replaceTipCommands(0),
      aspirateHelper('A1', volume),
      dispenseHelper('A1', volume),
      aspirateHelper('A1', volume),
      dispenseHelper('A1', volume),
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
      flatMap(args.wells, (well: string, idx: number) => [
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
