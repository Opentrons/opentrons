import { Provider } from 'react-redux'
import { act, renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { useGuardedAction } from '../useGuardedAction'
import { useRequireDocumentation } from '../useRequireDocumentation'
import { useRequireLogin } from '../useRequireLogin'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { State } from '/app/redux/types'
import type { DocumentedAction } from '/app/resources/access-control'

vi.mock('@opentrons/react-api-client', () => ({
  useAccessControlEnabledQuery: vi.fn(),
}))

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    getCurrentUsernameForLocalRobot: vi.fn(() => null),
  }
})

vi.mock('../useRequireLogin', () => ({
  useRequireLogin: vi.fn(),
}))

vi.mock('../useRequireDocumentation', () => ({
  useRequireDocumentation: vi.fn(),
}))

const store: Store<State> = legacy_createStore(state => state, {} as State)
const wrapper: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
  <Provider store={store}>{children}</Provider>
)

const ACTION: DocumentedAction = {
  kind: 'PROTOCOL_PLAY',
  runId: 'run-1',
  protocolName: 'My Protocol',
}

describe('useGuardedAction', () => {
  const requireLogin = vi.fn()
  const requireDocumentation = vi.fn()

  beforeEach(() => {
    vi.mocked(useRequireLogin).mockReturnValue(requireLogin)
    vi.mocked(useRequireDocumentation).mockReturnValue(requireDocumentation)
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

    const { result } = renderHook(() => useGuardedAction(ACTION), { wrapper })

    const got = await act(async () => await result.current())
    expect(got).toBe(true)
    expect(requireLogin).not.toHaveBeenCalled()
    expect(requireDocumentation).not.toHaveBeenCalled()
  })

  it('returns true and runs login then documentation when both guards pass', async () => {
    requireLogin.mockResolvedValue({ username: 'alice' })
    requireDocumentation.mockResolvedValue({
      note: 'note',
      confirmedAt: 'now',
      documentedBy: 'alice',
    })

    const { result } = renderHook(() => useGuardedAction(ACTION), { wrapper })

    const got = await act(async () => await result.current())
    expect(got).toBe(true)

    const loginOrder = requireLogin.mock.invocationCallOrder[0]
    const docOrder = requireDocumentation.mock.invocationCallOrder[0]
    expect(loginOrder).toBeLessThan(docOrder)
  })

  it('returns false and skips documentation when login is dismissed', async () => {
    requireLogin.mockResolvedValue(null)

    const { result } = renderHook(() => useGuardedAction(ACTION), { wrapper })

    const got = await act(async () => await result.current())
    expect(got).toBe(false)
    expect(requireDocumentation).not.toHaveBeenCalled()
  })

  it('returns false when documentation is dismissed', async () => {
    requireLogin.mockResolvedValue({ username: 'alice' })
    requireDocumentation.mockResolvedValue(null)

    const { result } = renderHook(() => useGuardedAction(ACTION), { wrapper })

    const got = await act(async () => await result.current())
    expect(got).toBe(false)
  })

  it('passes the login result to the documentation guard alongside the action', async () => {
    const loginResult = { username: 'alice' }
    requireLogin.mockResolvedValue(loginResult)
    requireDocumentation.mockResolvedValue({
      note: 'note',
      confirmedAt: 'now',
      documentedBy: 'alice',
    })

    const { result } = renderHook(() => useGuardedAction(ACTION), { wrapper })

    await act(async () => await result.current())
    expect(requireDocumentation).toHaveBeenCalledWith(ACTION, loginResult)
  })
})
