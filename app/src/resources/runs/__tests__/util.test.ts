import { describe, it, expect } from 'vitest'
import { formatTimeWithUtcLabel, setCommandIntent } from '../utils'

import type { CreateCommand } from '@opentrons/shared-data'

describe('formatTimeWithUtc', () => {
  it('return formatted time with UTC', () => {
    const result = formatTimeWithUtcLabel('2023-08-20T20:25')
    expect(result).toEqual('8/20/23 20:25 UTC')
  })
  it('return formatted time with UTC without T', () => {
    const result = formatTimeWithUtcLabel('08/22/2023 21:35:04')
    expect(result).toEqual('8/22/23 21:35 UTC')
  })

  it('return formatted time with UTC only hh:mm', () => {
    const result = formatTimeWithUtcLabel('21:35:04')
    expect(result).toEqual('21:35:04 UTC')
  })

  it('return unknown if time is null', () => {
    const result = formatTimeWithUtcLabel(null)
    expect(result).toEqual('unknown')
  })
})

const mockCommand = {
  commandType: 'home',
  params: {},
  intent: 'protocol',
} as CreateCommand

describe('setCommandIntent', () => {
  it('explicitly sets the command intent to "fixit" if a failedCommandId is specified', () => {
    const commandWithFixitIntent = setCommandIntent(mockCommand, 'MOCK_ID')
    expect(commandWithFixitIntent.intent).toEqual('fixit')
  })
  it('does not modify the command intent if no failedCommandId is specified', () => {
    const command = setCommandIntent(mockCommand)
    expect(command.intent).toEqual('protocol')
  })
})
