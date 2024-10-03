import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSelector } from 'react-redux'
import { getUserId } from '/app/redux/config'
import { useClientDataRecovery } from '/app/resources/client_data'
import { renderHook } from '@testing-library/react'
import { useErrorRecoveryBanner } from '../index'

vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}))
vi.mock('/app/redux/config')
vi.mock('/app/resources/client_data')

describe('useErrorRecoveryBanner', () => {
  beforeEach(() => {
    vi.mocked(useSelector).mockReturnValue('thisUserId')
    vi.mocked(getUserId).mockReturnValue('thisUserId')
    vi.mocked(useClientDataRecovery).mockReturnValue({
      userId: null,
      intent: null,
    })
  })

  it('should return initial values', () => {
    const { result } = renderHook(() => useErrorRecoveryBanner())

    expect(result.current).toEqual({
      showRecoveryBanner: false,
      recoveryIntent: 'recovering',
    })
  })

  it('should show banner when userId is different', () => {
    vi.mocked(useClientDataRecovery).mockReturnValue({
      userId: 'otherUserId',
      intent: null,
    })

    const { result } = renderHook(() => useErrorRecoveryBanner())

    expect(result.current.showRecoveryBanner).toBe(true)
  })

  it('should return correct intent when provided', () => {
    vi.mocked(useClientDataRecovery).mockReturnValue({
      userId: 'otherUserId',
      intent: 'canceling',
    })

    const { result } = renderHook(() => useErrorRecoveryBanner())

    expect(result.current.recoveryIntent).toBe('canceling')
  })
})
