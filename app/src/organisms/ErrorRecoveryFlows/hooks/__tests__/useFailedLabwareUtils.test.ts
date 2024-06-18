import { describe, it, expect } from 'vitest'

import { getPickUpTipCommandWellName } from '../useFailedLabwareUtils'

describe('getPickUpTipCommandWellName', () => {
  const failedPipetteInfo = {
    data: {
      channels: 8,
    },
  } as any

  const recentRelevantPickUpTipCmd = {
    params: {
      pipetteId: 'pipetteId',
      labwareId: 'labwareId',
      wellName: 'A1',
    },
  } as any

  it('should return an empty string if failedPipetteInfo is null', () => {
    const result = getPickUpTipCommandWellName(null, recentRelevantPickUpTipCmd)
    expect(result).toBe('')
  })

  it('should return an empty string if recentRelevantPickUpTipCmd is null', () => {
    const result = getPickUpTipCommandWellName(failedPipetteInfo, null)
    expect(result).toBe('')
  })

  it('should return the wellName if the pipette has 1 channel', () => {
    const result = getPickUpTipCommandWellName(
      { ...failedPipetteInfo, data: { channels: 1 } },
      recentRelevantPickUpTipCmd
    )
    expect(result).toBe('A1')
  })

  it('should return a range of well names if the pipette has 8 channels', () => {
    const result = getPickUpTipCommandWellName(
      failedPipetteInfo,
      recentRelevantPickUpTipCmd
    )
    expect(result).toBe('A1 - H1')
  })

  it('should return the wellName if the pipette has 96 channels', () => {
    const result = getPickUpTipCommandWellName(
      { ...failedPipetteInfo, data: { channels: 96 } },
      recentRelevantPickUpTipCmd
    )
    expect(result).toBe('A1')
  })

  it('should handle different wellName formats correctly', () => {
    const result = getPickUpTipCommandWellName(failedPipetteInfo, {
      ...recentRelevantPickUpTipCmd,
      params: { ...recentRelevantPickUpTipCmd.params, wellName: 'B12' },
    })
    expect(result).toBe('A12 - H12')
  })
})
