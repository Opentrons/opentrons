import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePostLogMessageMutation } from '@opentrons/react-api-client'

import {
  ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
  createReasonNotRequiredDocumentationState,
} from '../__fixtures__/documentationState'
import { useCoalescedJogAudit } from '../useCoalescedJogAudit'

import type { DocumentationState } from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', () => ({
  usePostLogMessageMutation: vi.fn(),
}))

describe('useCoalescedJogAudit', () => {
  const mockPostLogMessage = vi.fn()
  const mockAddActionToDocument = vi.fn()
  const enabledDocState = createReasonNotRequiredDocumentationState()

  beforeEach(() => {
    vi.mocked(usePostLogMessageMutation).mockReturnValue({
      postLogMessage: mockPostLogMessage,
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderAuditHook = (
    commandDocState: DocumentationState = enabledDocState
  ) =>
    renderHook(() =>
      useCoalescedJogAudit(commandDocState, mockAddActionToDocument)
    )

  it('posts one jog_pipette record per successful jog on flush', () => {
    const { result } = renderAuditHook()

    act(() => {
      result.current.recordJog('x', 1, 1)
      result.current.recordJog('x', 1, 0.1)
      result.current.recordJog('y', 1, 0.1)
      result.current.flush()
    })

    expect(mockPostLogMessage).toHaveBeenCalledTimes(3)
    expect(mockPostLogMessage).toHaveBeenNthCalledWith(1, {
      action: 'jog_pipette',
      message: 'Jogged X: 1.0mm',
    })
    expect(mockPostLogMessage).toHaveBeenNthCalledWith(2, {
      action: 'jog_pipette',
      message: 'Jogged X: 0.1mm',
    })
    expect(mockPostLogMessage).toHaveBeenNthCalledWith(3, {
      action: 'jog_pipette',
      message: 'Jogged Y: 0.1mm',
    })
    expect(mockAddActionToDocument).toHaveBeenCalledTimes(1)
    expect(mockAddActionToDocument).toHaveBeenCalledWith('jog_pipette')
  })

  it('still posts when jogs cancel out to net zero', () => {
    const { result } = renderAuditHook()

    act(() => {
      result.current.recordJog('x', 1, 1)
      result.current.recordJog('x', -1, 1)
      result.current.flush()
    })

    expect(mockPostLogMessage).toHaveBeenCalledTimes(2)
    expect(mockPostLogMessage).toHaveBeenNthCalledWith(1, {
      action: 'jog_pipette',
      message: 'Jogged X: 1.0mm',
    })
    expect(mockPostLogMessage).toHaveBeenNthCalledWith(2, {
      action: 'jog_pipette',
      message: 'Jogged X: -1.0mm',
    })
  })

  it('does not record a zero-distance jog', () => {
    const { result } = renderAuditHook()

    act(() => {
      result.current.recordJog('x', 1, 0)
      result.current.flush()
    })

    expect(mockPostLogMessage).not.toHaveBeenCalled()
    expect(mockAddActionToDocument).not.toHaveBeenCalled()
  })

  it('does not post when access control is disabled', () => {
    const { result } = renderAuditHook(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )

    act(() => {
      result.current.recordJog('x', 1, 1)
      result.current.flush()
    })

    expect(mockPostLogMessage).not.toHaveBeenCalled()
    expect(mockAddActionToDocument).not.toHaveBeenCalled()
  })

  it('does not post after reset, even if jogs were recorded', () => {
    const { result } = renderAuditHook()

    act(() => {
      result.current.recordJog('z', -1, 10)
      result.current.reset()
      result.current.flush()
    })

    expect(mockPostLogMessage).not.toHaveBeenCalled()
    expect(mockAddActionToDocument).not.toHaveBeenCalled()
  })

  it('clears the accumulator so a second flush is a no-op', () => {
    const { result } = renderAuditHook()

    act(() => {
      result.current.recordJog('x', 1, 1)
      result.current.flush()
      result.current.flush()
    })

    expect(mockPostLogMessage).toHaveBeenCalledTimes(1)
  })
})
