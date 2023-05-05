import { getIsOT3Protocol, getRobotTypeDisplayName } from '../utils'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const mockOT3ProtocolAnalysisOutput = {
  robotType: 'OT-3 Standard',
} as ProtocolAnalysisOutput

const mockOT2ProtocolAnalysisOutput = {
  robotType: 'OT-2 Standard',
} as ProtocolAnalysisOutput

describe('getIsOT3Protocol', () => {
  it('should return true for protocols intended for an OT-3', () => {
    const result = getIsOT3Protocol(mockOT3ProtocolAnalysisOutput)
    expect(result).toBe(true)
  })

  it('should return false for protocols intended for an OT-2', () => {
    const result = getIsOT3Protocol(mockOT2ProtocolAnalysisOutput)
    expect(result).toBe(false)
  })

  it('should return false for protocols that do not specify a robot type', () => {
    const result = getIsOT3Protocol({} as ProtocolAnalysisOutput)
    expect(result).toBe(false)
  })

  it('should return false given null', () => {
    const result = getIsOT3Protocol(null)
    expect(result).toBe(false)
  })
})

describe('getRobotTypeDisplayName', () => {
  it('should return OT-3 for protocols intended for an OT-3', () => {
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
