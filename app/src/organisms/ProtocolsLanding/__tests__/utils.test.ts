import { describe, it, expect } from 'vitest'
import {
  getAnalysisStatus,
  getisFlexProtocol,
  getRobotTypeDisplayName,
} from '../utils'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const mockOT3ProtocolAnalysisOutput = {
  robotType: 'OT-3 Standard',
} as ProtocolAnalysisOutput

const mockOT2ProtocolAnalysisOutput = {
  robotType: 'OT-2 Standard',
} as ProtocolAnalysisOutput

describe('getAnalysisStatus', () => {
  it('should return stale if no liquids in analysis', () => {
    const result = getAnalysisStatus(false, {
      ...mockOT3ProtocolAnalysisOutput,
      liquids: [],
      errors: [],
    })
    expect(result).toBe('stale')
  })

  it('should return stale if no runTimeParameters in analysis', () => {
    const result = getAnalysisStatus(false, {
      ...mockOT3ProtocolAnalysisOutput,
      runTimeParameters: [],
      errors: [],
    })
    expect(result).toBe('stale')
  })

  it('should return complete if liquids and runTimeParameters in analysis', () => {
    const result = getAnalysisStatus(false, {
      ...mockOT3ProtocolAnalysisOutput,
      liquids: [],
      runTimeParameters: [],
      errors: [],
    })
    expect(result).toBe('complete')
  })
})

describe('getisFlexProtocol', () => {
  it('should return true for protocols intended for a Flex', () => {
    const result = getisFlexProtocol(mockOT3ProtocolAnalysisOutput)
    expect(result).toBe(true)
  })

  it('should return false for protocols intended for an OT-2', () => {
    const result = getisFlexProtocol(mockOT2ProtocolAnalysisOutput)
    expect(result).toBe(false)
  })

  it('should return false for protocols that do not specify a robot type', () => {
    const result = getisFlexProtocol({} as ProtocolAnalysisOutput)
    expect(result).toBe(false)
  })

  it('should return false given null', () => {
    const result = getisFlexProtocol(null)
    expect(result).toBe(false)
  })
})

describe('getRobotTypeDisplayName', () => {
  it('should return OT-3 for protocols intended for a Flex', () => {
    const result = getRobotTypeDisplayName('OT-3 Standard')
    expect(result).toBe('Opentrons Flex')
  })

  it('should return OT-2 for protocols intended for an OT-2', () => {
    const result = getRobotTypeDisplayName('OT-2 Standard')
    expect(result).toBe('OT-2')
  })

  it('should return OT-2 for protocols that do not specify a robot type', () => {
    const result = getRobotTypeDisplayName(null)
    expect(result).toBe('OT-2')
  })
})
