import { describe, it, expect } from 'vitest'
import { getAnalysisStatus } from '../getAnalysisStatus'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const mockAnalysisOutput = {
  robotType: 'OT-3 Standard',
} as ProtocolAnalysisOutput

describe('getAnalysisStatus', () => {
  it('should return stale if no liquids in analysis', () => {
    const result = getAnalysisStatus(false, {
      ...mockAnalysisOutput,
      liquids: [],
      errors: [],
    })
    expect(result).toBe('stale')
  })

  it('should return stale if no runTimeParameters in analysis', () => {
    const result = getAnalysisStatus(false, {
      ...mockAnalysisOutput,
      runTimeParameters: [],
      errors: [],
    })
    expect(result).toBe('stale')
  })

  it('should return complete if liquids and runTimeParameters in analysis', () => {
    const result = getAnalysisStatus(false, {
      ...mockAnalysisOutput,
      liquids: [],
      runTimeParameters: [],
      errors: [],
    })
    expect(result).toBe('complete')
  })
})
