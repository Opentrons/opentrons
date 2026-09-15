import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useErrorRecoverySettings,
  useUpdateErrorRecoverySettings,
} from '@opentrons/react-api-client'

import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'

import { useErrorRecoverySettingsToggle } from '..'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

describe('useErrorRecoverySettingsToggle', () => {
  beforeEach(() => {
    vi.mocked(useErrorRecoverySettings).mockReturnValue({
      data: undefined,
    } as any)
    vi.mocked(useUpdateErrorRecoverySettings).mockReturnValue({
      updateErrorRecoverySettings: vi.fn(),
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
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      {
        data: { enabled: false },
      },
      { onError: expect.any(Function) }
    )
    expect(useUpdateErrorRecoverySettings).toHaveBeenCalledWith(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )

    act(() => {
      result.current.toggleERSettings()
    })

    expect(result.current.isEREnabled).toBe(true)
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      { data: { enabled: true } },
      { onError: expect.any(Function) }
    )
  })
})
