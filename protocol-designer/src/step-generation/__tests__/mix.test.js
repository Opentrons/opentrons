// @flow
import flatMap from 'lodash/flatMap'
import { mix } from '../commandCreators/compound/mix'
import {
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  replaceTipCommands,
  getFlowRateAndOffsetParamsMix,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
  makeAspirateHelper,
  makeDispenseHelper,
  blowoutHelper,
  makeTouchTipHelper,
} from '../__fixtures__'
import type { MixArgs } from '../types'

const aspirateHelper = makeAspirateHelper()
const dispenseHelper = makeDispenseHelper({ labware: SOURCE_LABWARE })
const touchTipHelper = makeTouchTipHelper()
// TODO: Ian 2019-06-14 more elegant way to test the blowout offset calculation
const BLOWOUT_OFFSET_ANY: any = expect.any(Number)

let invariantContext
let robotStateWithTip
let mixinArgs

beforeEach(() => {
  mixinArgs = {
    ...getFlowRateAndOffsetParamsMix(),
    commandCreatorFnName: 'mix',
    name: 'mix test',
    description: 'test blah blah',

    pipette: DEFAULT_PIPETTE,
    labware: SOURCE_LABWARE,

    blowoutLocation: null,
    touchTip: false,

    aspirateDelay: null,
    dispenseDelay: null,
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
  it('changeTip="always"', () => {
    const args = makeArgs('always')
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well: string, idx: number) => [
        ...replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
      ])
    )
  })

  it('changeTip="once"', () => {
    const args = makeArgs('once')
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      ...replaceTipCommands(0),
      ...flatMap(args.wells, well => [
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
      ]),
    ])
  })

  it('changeTip="never"', () => {
    const args = makeArgs('never')
    const result = mix(args, invariantContext, robotStateWithTip)
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

  it('flow rate', () => {
    const args = {
      ...mixinArgs,
      volume,
      times,
      wells: ['A1'],
      changeTip: 'once',
    }

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      ...replaceTipCommands(0),
      aspirateHelper('A1', volume),
      dispenseHelper('A1', volume),
      aspirateHelper('A1', volume),
      dispenseHelper('A1', volume),
    ])
  })

  it('touch tip (after each dispense)', () => {
    const args: MixArgs = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      touchTip: true,
      wells: ['A1', 'B1', 'C1'],
    }

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well: string, idx: number) => [
        ...replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        touchTipHelper(well),
      ])
    )
  })

  it('blowout', () => {
    const args: MixArgs = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      blowoutLocation: blowoutLabwareId,
      wells: ['A1', 'B1', 'C1'],
    }

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        blowoutHelper(blowoutLabwareId, {
          offsetFromBottomMm: BLOWOUT_OFFSET_ANY,
        }),
      ])
    )
  })

  it('touch tip after blowout', () => {
    const args: MixArgs = {
      ...mixinArgs,
      volume,
      times,
      changeTip: 'always',
      blowoutLocation: blowoutLabwareId,
      touchTip: true,
      wells: ['A1', 'B1', 'C1'],
    }

    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual(
      flatMap(args.wells, (well, idx) => [
        ...replaceTipCommands(idx),
        aspirateHelper(well, volume),
        dispenseHelper(well, volume),

        aspirateHelper(well, volume),
        dispenseHelper(well, volume),
        blowoutHelper(blowoutLabwareId, {
          offsetFromBottomMm: BLOWOUT_OFFSET_ANY,
        }),
        touchTipHelper(well),
      ])
    )
  })
})

describe('mix: errors', () => {
  let errorArgs
  beforeEach(() => {
    errorArgs = {
      ...mixinArgs,
      volume: 8,
      times: 2,
      changeTip: 'once',
      wells: ['A1', 'A2'],
    }
  })
  it('invalid labware', () => {
    const args: MixArgs = {
      ...errorArgs,
      labware: 'invalidLabwareId',
    }
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  it('invalid pipette', () => {
    const args: MixArgs = {
      ...errorArgs,
      pipette: 'invalidPipetteId',
    }
    const result = mix(args, invariantContext, robotStateWithTip)
    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'PIPETTE_DOES_NOT_EXIST',
    })
  })

  // TODO Ian 2018-05-08
  it.todo('"times" arg non-integer')
  it.todo('"times" arg negative')
})
