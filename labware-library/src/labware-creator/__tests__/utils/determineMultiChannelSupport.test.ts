import { resetAllWhenMocks, when } from 'jest-when'
import { getWellNamePerMultiTip } from '@opentrons/shared-data'
import { determineMultiChannelSupport } from '../../utils/determineMultiChannelSupport'

jest.mock('@opentrons/shared-data')

const getWellNamePerMultiTipMock = getWellNamePerMultiTip as jest.MockedFunction<
  typeof getWellNamePerMultiTip
>

describe('determineMultiChannelSupport', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })

  it('should disable pipette field when definition is null', () => {
    const def = null
    const result = determineMultiChannelSupport(def)
    expect(result).toEqual({
      disablePipetteField: true,
      allowMultiChannel: false,
    })
  })

  it('should allow multi channel when getWellNamePerMultiTip returns 8 wells', () => {
    const def: any = 'fakeDef'
    when(getWellNamePerMultiTipMock)
      .calledWith(def, 'A1', 8)
      .mockReturnValue(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'])
    const result = determineMultiChannelSupport(def)
    expect(result).toEqual({
      disablePipetteField: false,
      allowMultiChannel: true,
    })
  })

  it('should NOT allow multi channel when getWellNamePerMultiTip does not return 8 wells', () => {
    const def: any = 'fakeDef'
    when(getWellNamePerMultiTipMock)
      .calledWith(def, 'A1', 8)
      .mockReturnValue(null)
    const result = determineMultiChannelSupport(def)
    expect(result).toEqual({
      disablePipetteField: false,
      allowMultiChannel: false,
    })
  })
})
