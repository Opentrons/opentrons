import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { requireDocumentation } from '../requireDocumentation'
import { requireLogin } from '../requireLogin'
import { useGuardedAction } from '../useGuardedAction'

import type ReactRedux from 'react-redux'
import type { DocumentedActionKind } from '../../../../resources/access-control/types'

vi.mock('@opentrons/react-api-client', () => ({
  useAccessControlEnabledQuery: vi.fn(),
}))

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof ReactRedux>()

  return {
    ...actual,
    useSelector: (selector: (state: unknown) => unknown) => selector({}),
  }
})

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    getCurrentUsernameForLocalRobot: vi.fn(() => null),
  }
})

vi.mock('../requireLogin', () => ({
  requireLogin: vi.fn(),
}))

vi.mock('../requireDocumentation', () => ({
  requireDocumentation: vi.fn(),
}))

const ACTIONS_TO_DOCUMENT: DocumentedActionKind[] = [
  {
    kind: 'PROTOCOL_PLAY',
  },
]

describe('useGuardedAction', () => {
  beforeEach(() => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('resolves true and skips both guards when access control is disabled', async () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: false } },
    } as ReturnType<typeof useAccessControlEnabledQuery>)

    const { result } = renderHook(() => useGuardedAction(ACTIONS_TO_DOCUMENT))

    const currentResult = await act(async () => await result.current())
    expect(currentResult).toBe(true)
    expect(requireLogin).not.toHaveBeenCalled()
    expect(requireDocumentation).not.toHaveBeenCalled()
  })

  it('returns true and runs login then documentation when both guards pass', async () => {
    vi.mocked(requireLogin).mockResolvedValue({ username: 'alice' })
    vi.mocked(requireDocumentation).mockResolvedValue({
      note: 'note',
      confirmedAt: '2026-05-01T16:00:00.000Z',
      documentedBy: 'alice',
    })

    const { result } = renderHook(() => useGuardedAction(ACTIONS_TO_DOCUMENT))

    const currentResult = await act(async () => await result.current())
    expect(currentResult).toBe(true)

    const loginOrder = vi.mocked(requireLogin).mock.invocationCallOrder[0]
    const docOrder = vi.mocked(requireDocumentation).mock.invocationCallOrder[0]
    expect(loginOrder).toBeLessThan(docOrder)
  })

  it('returns false and skips documentation when login is dismissed', async () => {
    vi.mocked(requireLogin).mockResolvedValue(null)

    const { result } = renderHook(() => useGuardedAction(ACTIONS_TO_DOCUMENT))

    const currentResult = await act(async () => await result.current())
    expect(currentResult).toBe(false)
    expect(requireDocumentation).not.toHaveBeenCalled()
  })

  it('returns false when documentation is dismissed', async () => {
    vi.mocked(requireLogin).mockResolvedValue({ username: 'alice' })
    vi.mocked(requireDocumentation).mockResolvedValue(null)

    const { result } = renderHook(() => useGuardedAction(ACTIONS_TO_DOCUMENT))

    const currentResult = await act(async () => await result.current())
    expect(currentResult).toBe(false)
  })

  it('passes the login result to the documentation guard alongside the action', async () => {
    const loginResult = { username: 'alice' }
    vi.mocked(requireLogin).mockResolvedValue(loginResult)
    vi.mocked(requireDocumentation).mockResolvedValue({
      note: 'note',
      confirmedAt: '2026-05-01T16:00:00.000Z',
      documentedBy: 'alice',
    })

    const { result } = renderHook(() => useGuardedAction(ACTIONS_TO_DOCUMENT))

    await act(async () => await result.current())
    expect(requireDocumentation).toHaveBeenCalledWith(
      ACTIONS_TO_DOCUMENT,
      loginResult
    )
  })
})
