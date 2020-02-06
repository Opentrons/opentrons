// @flow
import _blowout from '../commandCreators/atomic/blowout'
import {
  blowoutUtil,
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '../utils'
import { curryCommandCreator } from '../utils/curryCommandCreator'
import {
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
  TROUGH_LABWARE,
  BLOWOUT_FLOW_RATE,
  BLOWOUT_OFFSET_FROM_TOP_MM,
  makeContext,
} from './fixtures'

jest.mock('../utils/curryCommandCreator')

let blowoutArgs

describe('blowoutUtil', () => {
  beforeEach(() => {
    blowoutArgs = {
      pipette: DEFAULT_PIPETTE,
      sourceLabwareId: SOURCE_LABWARE,
      sourceWell: 'A1',
      destLabwareId: DEST_LABWARE,
      destWell: 'A2',
      flowRate: BLOWOUT_FLOW_RATE,
      offsetFromTopMm: BLOWOUT_OFFSET_FROM_TOP_MM,
      invariantContext: makeContext(),
    }

    // $FlowFixMe
    curryCommandCreator.mockClear()
    // $FlowFixMe
    curryCommandCreator.mockReturnValue('return value from blowout')
  })

  test('blowoutUtil curries blowout with source well params', () => {
    blowoutUtil({
      ...blowoutArgs,
      blowoutLocation: SOURCE_WELL_BLOWOUT_DESTINATION,
    })

    expect(curryCommandCreator).toHaveBeenCalledWith(_blowout, {
      pipette: blowoutArgs.pipette,
      labware: blowoutArgs.sourceLabwareId,
      well: blowoutArgs.sourceWell,
      flowRate: blowoutArgs.flowRate,
      offsetFromBottomMm: expect.any(Number),
    })
  })

  test('blowoutUtil curries blowout with dest plate params', () => {
    blowoutUtil({
      ...blowoutArgs,
      blowoutLocation: DEST_WELL_BLOWOUT_DESTINATION,
    })

    expect(curryCommandCreator).toHaveBeenCalledWith(_blowout, {
      pipette: blowoutArgs.pipette,
      labware: blowoutArgs.destLabwareId,
      well: blowoutArgs.destWell,
      flowRate: blowoutArgs.flowRate,
      offsetFromBottomMm: expect.any(Number),
    })
  })

  test('blowoutUtil curries blowout with an arbitrary labware Id', () => {
    blowoutUtil({
      ...blowoutArgs,
      blowoutLocation: TROUGH_LABWARE,
    })

    expect(curryCommandCreator).toHaveBeenCalledWith(_blowout, {
      pipette: blowoutArgs.pipette,
      labware: TROUGH_LABWARE,
      well: 'A1',
      flowRate: blowoutArgs.flowRate,
      offsetFromBottomMm: expect.any(Number),
    })
  })

  test('blowoutUtil returns an empty array if not given a blowoutLocation', () => {
    const result = blowoutUtil({ ...blowoutArgs, blowoutLocation: null })
    expect(curryCommandCreator).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })
})
