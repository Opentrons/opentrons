import { getIsOT3Protocol } from '../utils'
// TODO(bh, 2022-12-12): replace when robotType added to ProtocolAnalysisOutput interface
import type { ProtocolAnalysisOutputWithRobotType } from '../utils'

const mockOT3ProtocolAnalysisOutput = {
  robotType: 'OT-3 Standard',
} as ProtocolAnalysisOutputWithRobotType

const mockOT2ProtocolAnalysisOutput = {
  robotType: 'OT-2 Standard',
} as ProtocolAnalysisOutputWithRobotType

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
    const result = getIsOT3Protocol({} as ProtocolAnalysisOutputWithRobotType)
    expect(result).toBe(false)
  })

  it('should return false given null', () => {
    const result = getIsOT3Protocol(null)
    expect(result).toBe(false)
  })
})
