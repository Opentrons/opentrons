import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useCommandQuery } from '@opentrons/react-api-client'

import { useLastRunProtocolCommand } from '../useLastRunProtocolCommand'

vi.mock('@opentrons/react-api-client')

const mockRunId = 'mock-run-id'
const mockCommandsData = {
  data: [
    { id: 'cmd1', key: 'key1' },
    { id: 'cmd2', key: 'key2' },
  ],
  meta: { totalLength: 2 },
} as any

describe('useLastRunCommandNoFixit', () => {
  it('returns the last run command when it is not a fixit command', () => {
    vi.mocked(useCommandQuery).mockReturnValue({ data: null } as any)

    const { result } = renderHook(() =>
      useLastRunProtocolCommand(mockRunId, mockCommandsData)
    )

    expect(result.current).toEqual({
      id: 'cmd2',
      key: 'key2',
    })
  })

  it('returns the failed command when the last run command is a fixit command', () => {
    const mockFixitCommand = {
      id: 'fixit-cmd',
      intent: 'fixit',
      failedCommandId: 'failed-cmd-id',
    }
    const mockFailedCommand = { id: 'failed-cmd-id', key: 'failed-key' }
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: mockFailedCommand },
    } as any)

    const { result } = renderHook(() =>
      useLastRunProtocolCommand(mockRunId, {
        data: [mockFixitCommand],
        meta: { totalLength: 1 },
      } as any)
    )

    expect(result.current).toEqual(mockFailedCommand)
  })

  it('returns null when there are no run commands', () => {
    const { result } = renderHook(() =>
      useLastRunProtocolCommand(mockRunId, null)
    )

    expect(result.current).toBeNull()
  })
})
