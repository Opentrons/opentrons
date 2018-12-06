// @flow
import _blowout from '../commandCreators/atomic/blowout'
import {
  blowoutUtil,
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '../utils'

jest.mock('../commandCreators/atomic/blowout')

const pipetteId = 'p300SingleId'
const sourceLabwareId = 'sourcePlateId'
const sourceWell = 'A1'
const destLabwareId = 'destPlateId'
const destWell = 'A2'

const blowoutArgs = [
  pipetteId,
  sourceLabwareId,
  sourceWell,
  destLabwareId,
  destWell,
]

describe('blowoutUtil', () => {
  beforeEach(() => {
    // $FlowFixMe
    _blowout.mockClear()
    // $FlowFixMe
    _blowout.mockReturnValue('return value from blowout')
  })

  test('blowoutUtil calls blowout with source well params', () => {
    blowoutUtil(
      ...blowoutArgs,

      SOURCE_WELL_BLOWOUT_DESTINATION,
    )

    expect(_blowout).toHaveBeenCalledWith({
      pipette: pipetteId,
      labware: sourceLabwareId,
      well: sourceWell,
    })
  })

  test('blowoutUtil calls blowout with dest plate params', () => {
    blowoutUtil(
      ...blowoutArgs,
      DEST_WELL_BLOWOUT_DESTINATION,
    )

    expect(_blowout).toHaveBeenCalledWith({
      pipette: pipetteId,
      labware: destLabwareId,
      well: destWell,
    })
  })

  test('blowoutUtil returns an empty array if not given a blowoutLocation', () => {
    const result = blowoutUtil(...blowoutArgs, null)
    expect(_blowout).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })
})
