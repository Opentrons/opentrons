import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { requireDocumentation } from '../requireDocumentation'
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
    expect(requireDocumentation).not.toHaveBeenCalled()
  })

  it('returns false when documentation is dismissed', async () => {
    vi.mocked(requireDocumentation).mockResolvedValue(null)

    const { result } = renderHook(() => useGuardedAction(ACTIONS_TO_DOCUMENT))

    const currentResult = await act(async () => await result.current())
    expect(currentResult).toBe(false)
  })
})
