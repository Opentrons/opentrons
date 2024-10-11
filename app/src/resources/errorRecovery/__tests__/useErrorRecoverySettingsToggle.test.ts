import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useErrorRecoverySettings,
  useUpdateErrorRecoverySettings,
} from '@opentrons/react-api-client'

import { useErrorRecoverySettingsToggle } from '..'

vi.mock('@opentrons/react-api-client')

describe('useErrorRecoverySettingsToggle', () => {
  beforeEach(() => {
    vi.mocked(useErrorRecoverySettings).mockReturnValue({
      data: undefined,
    } as any)
    vi.mocked(useUpdateErrorRecoverySettings).mockReturnValue({
      useErrorRecoverySettings: vi.fn(),
    } as any)
  })

  it('should initialize with default value', () => {
    const { result } = renderHook(() => useErrorRecoverySettingsToggle())

    expect(result.current.isEREnabled).toBe(true)
  })

  it('should update isEREnabled when data changes', () => {
    const { result, rerender } = renderHook(() =>
      useErrorRecoverySettingsToggle()
    )

    expect(result.current.isEREnabled).toBe(true)

    vi.mocked(useErrorRecoverySettings).mockReturnValue({
      data: { data: { enabled: false } },
    } as any)
    rerender()

    expect(result.current.isEREnabled).toBe(false)
  })

  it('should toggle ER settings', () => {
    const mockUpdateSettings = vi.fn()
    vi.mocked(useErrorRecoverySettings).mockReturnValue({
      data: { data: { enabled: true } },
    } as any)
    vi.mocked(useUpdateErrorRecoverySettings).mockReturnValue({
      updateErrorRecoverySettings: mockUpdateSettings,
    } as any)

    const { result } = renderHook(() => useErrorRecoverySettingsToggle())

    expect(result.current.isEREnabled).toBe(true)

    act(() => {
      result.current.toggleERSettings()
    })

    expect(result.current.isEREnabled).toBe(false)
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      data: { enabled: false },
    })

    act(() => {
      result.current.toggleERSettings()
    })

    expect(result.current.isEREnabled).toBe(true)
    expect(mockUpdateSettings).toHaveBeenCalledWith({ data: { enabled: true } })
  })
})
