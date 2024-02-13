import { vi, describe, it, expect, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { getWellNamePerMultiTip } from '@opentrons/shared-data'
import { determineMultiChannelSupport } from '../../utils/determineMultiChannelSupport'

vi.mock('@opentrons/shared-data')

describe('determineMultiChannelSupport', () => {
  afterEach(() => {
    vi.restoreAllMocks()
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
    when(vi.mocked(getWellNamePerMultiTip))
      .calledWith(def, 'A1', 8)
      .thenReturn(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'])
    const result = determineMultiChannelSupport(def)
    expect(result).toEqual({
      disablePipetteField: false,
      allowMultiChannel: true,
    })
  })

  it('should NOT allow multi channel when getWellNamePerMultiTip does not return 8 wells', () => {
    const def: any = 'fakeDef'
    when(vi.mocked(getWellNamePerMultiTip))
      .calledWith(def, 'A1', 8)
      .thenReturn(null)
    const result = determineMultiChannelSupport(def)
    expect(result).toEqual({
      disablePipetteField: false,
      allowMultiChannel: false,
    })
  })
})
