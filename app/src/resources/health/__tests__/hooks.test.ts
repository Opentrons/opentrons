import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useHealthQuery } from '@opentrons/react-api-client'

import { useRobotInitializationStatus, INIT_STATUS } from '../hooks'

vi.mock('@opentrons/react-api-client')

describe('useRobotInitializationStatus', () => {
  it('should return "INITIALIZING" when response status code is 503', () => {
    vi.mocked(useHealthQuery).mockImplementation(({ onSuccess }: any) =>
      onSuccess({ status: 503 })
    )
    const { result } = renderHook(() => useRobotInitializationStatus())
    expect(result.current).toBe(INIT_STATUS.INITIALIZING)
  })

  it('should return "SUCCEEDED" when response status code is 200', () => {
    vi.mocked(useHealthQuery).mockImplementation(({ onSuccess }: any) =>
      onSuccess({ status: 200 })
    )
    const { result } = renderHook(() => useRobotInitializationStatus())
    expect(result.current).toBe(INIT_STATUS.SUCCEEDED)
  })

  it('should return "FAILED" when response status code is 500', () => {
    vi.mocked(useHealthQuery).mockImplementation(({ onSuccess }: any) =>
      onSuccess({ status: 500 })
    )
    const { result } = renderHook(() => useRobotInitializationStatus())
    expect(result.current).toBe(INIT_STATUS.FAILED)
  })

  it('should return null when response status code is not 200, 500, or 503.', () => {
    vi.mocked(useHealthQuery).mockImplementation(({ onSuccess }: any) =>
      onSuccess({ status: 404 })
    )
    const { result } = renderHook(() => useRobotInitializationStatus())
    expect(result.current).toBeNull()
  })
})
