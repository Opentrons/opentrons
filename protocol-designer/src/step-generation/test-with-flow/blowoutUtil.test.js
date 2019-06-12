// @flow
import _blowout from '../commandCreators/atomic/blowout'
import {
  blowoutUtil,
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '../utils'

jest.mock('../commandCreators/atomic/blowout')

const blowoutArgs = {
  pipette: 'p300SingleId',
  sourceLabware: 'sourcePlateId',
  sourceWell: 'A1',
  destLabware: 'destPlateId',
  destWell: 'A2',
  flowRate: 1.23,
  offsetFromBottomMm: 1.02,
}

describe('blowoutUtil', () => {
  beforeEach(() => {
    // $FlowFixMe
    _blowout.mockClear()
    // $FlowFixMe
    _blowout.mockReturnValue('return value from blowout')
  })

  test('blowoutUtil calls blowout with source well params', () => {
    blowoutUtil({
      ...blowoutArgs,
      blowoutLocation: SOURCE_WELL_BLOWOUT_DESTINATION,
    })

    expect(_blowout).toHaveBeenCalledWith({
      pipette: blowoutArgs.pipette,
      labware: blowoutArgs.sourceLabware,
      well: blowoutArgs.sourceWell,
      flowRate: blowoutArgs.flowRate,
      offsetFromBottomMm: blowoutArgs.offsetFromBottomMm,
    })
  })

  test('blowoutUtil calls blowout with dest plate params', () => {
    blowoutUtil({
      ...blowoutArgs,
      blowoutLocation: DEST_WELL_BLOWOUT_DESTINATION,
    })

    expect(_blowout).toHaveBeenCalledWith({
      pipette: blowoutArgs.pipette,
      labware: blowoutArgs.destLabware,
      well: blowoutArgs.destWell,
      flowRate: blowoutArgs.flowRate,
      offsetFromBottomMm: blowoutArgs.offsetFromBottomMm,
    })
  })

  test('blowoutUtil returns an empty array if not given a blowoutLocation', () => {
    const result = blowoutUtil({ ...blowoutArgs, blowoutLocation: null })
    expect(_blowout).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })
})
