import { describe, it, vi, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSelector } from 'react-redux'

import { useRecoveryTakeover } from '../useRecoveryTakeover'
import { getUserId } from '/app/redux/config'
import {
  useClientDataRecovery,
  useUpdateClientDataRecovery,
} from '/app/resources/client_data'

import type { Mock } from 'vitest'

vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}))
vi.mock('/app/redux/config')
vi.mock('/app/resources/client_data')

describe('useRecoveryTakeover', () => {
  let mockToggleERWiz: Mock
  let mockUpdateWithIntent: Mock
  let mockClearClientData: Mock

  beforeEach(() => {
    mockToggleERWiz = vi.fn(() => Promise.resolve())
    mockUpdateWithIntent = vi.fn()
    mockClearClientData = vi.fn()

    vi.mocked(useSelector).mockReturnValue('thisUserId')
    vi.mocked(getUserId).mockReturnValue('thisUserId')
    vi.mocked(useClientDataRecovery).mockReturnValue({
      userId: null,
      intent: null,
    })
    vi.mocked(useUpdateClientDataRecovery).mockReturnValue({
      updateWithIntent: mockUpdateWithIntent,
      clearClientData: mockClearClientData,
    } as any)
  })

  it('should return initial values', () => {
    const { result } = renderHook(() => useRecoveryTakeover(mockToggleERWiz))

    expect(result.current).toEqual({
      showTakeover: false,
      intent: null,
      toggleERWizAsActiveUser: expect.any(Function),
      isActiveUser: false,
    })
  })

  it('should show takeover when activeId is different from thisUserId', () => {
    vi.mocked(useClientDataRecovery).mockReturnValue({
      userId: 'otherUserId',
      intent: null,
    })

    const { result } = renderHook(() => useRecoveryTakeover(mockToggleERWiz))

    expect(result.current.showTakeover).toBe(true)
  })

  it('should not show takeover when activeId is null', () => {
    vi.mocked(useClientDataRecovery).mockReturnValue({
      userId: null,
      intent: null,
    })

    const { result } = renderHook(() => useRecoveryTakeover(mockToggleERWiz))

    expect(result.current.showTakeover).toBe(false)
  })

  it('should update active user status and intent when toggleERWizAsActiveUser is called', async () => {
    const { result } = renderHook(() => useRecoveryTakeover(mockToggleERWiz))

    await act(async () => {
      await result.current.toggleERWizAsActiveUser(true, true)
    })

    expect(result.current.isActiveUser).toBe(true)
    expect(mockUpdateWithIntent).toHaveBeenCalledWith('recovering')
    expect(mockToggleERWiz).toHaveBeenCalledWith(true, true)
  })

  it('should clear client data when toggleERWizAsActiveUser is called to deactivate', async () => {
    const { result } = renderHook(() => useRecoveryTakeover(mockToggleERWiz))

    await act(async () => {
      await result.current.toggleERWizAsActiveUser(true, true)
    })

    await act(async () => {
      await result.current.toggleERWizAsActiveUser(false, false)
    })

    expect(result.current.isActiveUser).toBe(false)
    expect(mockClearClientData).toHaveBeenCalled()
    expect(mockToggleERWiz).toHaveBeenCalledWith(false, false)
  })

  it('should update isActiveUser when activeId changes', () => {
    const { result, rerender } = renderHook(() =>
      useRecoveryTakeover(mockToggleERWiz)
    )

    act(() => {
      result.current.toggleERWizAsActiveUser(true, true)
    })

    expect(result.current.isActiveUser).toBe(true)

    vi.mocked(useClientDataRecovery).mockReturnValue({
      userId: 'otherUserId',
      intent: null,
    })

    rerender()

    expect(result.current.isActiveUser).toBe(false)
  })
})
