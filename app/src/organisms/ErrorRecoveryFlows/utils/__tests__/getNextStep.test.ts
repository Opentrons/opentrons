import { describe, expect, it } from 'vitest'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { getNextStep, getNextSteps } from '../getNextStep'

import type { RunCommandSummary } from '@opentrons/api-client'

const mockFailedCommand = mockRecoveryContentProps.failedCommand

describe('getNextStep', () => {
  const mockProtocolAnalysis = {
    commands: [
      { key: 'command1' },
      mockFailedCommand?.byAnalysis,
      { key: 'command3' },
    ] as RunCommandSummary[],
  } as any

  it('returns the next protocol step when the failedCommand exists in the protocolAnalysis', () => {
    const result = getNextStep(mockFailedCommand, mockProtocolAnalysis)
    expect(result).toEqual({ key: 'command3' })
  })

  it('returns null when the failedCommand is the last command in the protocolAnalysis', () => {
    const lastFailedCommand = {
      ...mockFailedCommand,
      key: 'command3',
    }

    const result = getNextStep(
      {
        byRunRecord: lastFailedCommand as any,
        byAnalysis: lastFailedCommand as any,
      },
      mockProtocolAnalysis
    )
    expect(result).toBeNull()
  })

  it('returns null when the failedCommand does not exist in the protocolAnalysis', () => {
    const nonExistentFailedCommand = {
      ...mockFailedCommand,
      key: 'non_existent_command_key',
    }

    const result = getNextStep(
      {
        byRunRecord: nonExistentFailedCommand as any,
        byAnalysis: nonExistentFailedCommand as any,
      },
      mockProtocolAnalysis
    )
    expect(result).toBeNull()
  })

  it('returns null when the failedCommand is null', () => {
    const result = getNextStep(null, mockProtocolAnalysis)
    expect(result).toBeNull()
  })

  it('returns null when the protocolAnalysis is null', () => {
    const result = getNextStep(mockFailedCommand, null)
    expect(result).toBeNull()
  })
})

describe('getNextSteps', () => {
  const mockProtocolAnalysis = {
    commands: [
      { key: 'command1' },
      mockFailedCommand?.byAnalysis,
      { key: 'command3' },
      { key: 'command4' },
    ] as RunCommandSummary[],
  } as any

  it('returns no more than requested', () => {
    const result = getNextSteps(mockFailedCommand, mockProtocolAnalysis, 1)
    expect(result).toEqual([{ key: 'command3' }])
  })

  it('returns null when the failedCommand is the last command in the protocolAnalysis', () => {
    const lastFailedCommand = {
      ...mockFailedCommand,
      key: 'command4',
    }

    const result = getNextStep(
      {
        byRunRecord: lastFailedCommand as any,
        byAnalysis: lastFailedCommand as any,
      },
      mockProtocolAnalysis
    )
    expect(result).toBeNull()
  })

  it('returns no more than available', () => {
    const result = getNextSteps(mockFailedCommand, mockProtocolAnalysis, 3)
    expect(result).toEqual([{ key: 'command3' }, { key: 'command4' }])
  })

  it('returns null when the failedCommand does not exist in the protocolAnalysis', () => {
    const nonExistentFailedCommand = {
      ...mockFailedCommand,
      key: 'non_existent_command_key',
    }

    const result = getNextStep(
      {
        byRunRecord: nonExistentFailedCommand as any,
        byAnalysis: nonExistentFailedCommand as any,
      },
      mockProtocolAnalysis
    )
    expect(result).toBeNull()
  })

  it('returns null when the failedCommand is null', () => {
    const result = getNextStep(null, mockProtocolAnalysis)
    expect(result).toBeNull()
  })

  it('returns null when the protocolAnalysis is null', () => {
    const result = getNextStep(mockFailedCommand, null)
    expect(result).toBeNull()
  })
})
