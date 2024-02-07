import { renderHook } from '@testing-library/react'

import { useHealthQuery } from '@opentrons/react-api-client'

import {
  useRobotInitializationStatus,
  INIT_STATUS,
} from '../useRobotInitializationStatus'

jest.mock('@opentrons/react-api-client')

const mockUseHealthQuery = useHealthQuery as jest.MockedFunction<
  typeof useHealthQuery
>

describe('useRobotInitializationStatus', () => {
  it('should return "INITIALIZING" when response status code is 503', () => {
    ;(mockUseHealthQuery as jest.Mock).mockImplementation(({ onSuccess }) => {
      onSuccess({ status: 503 })

      const { result } = renderHook(() => useRobotInitializationStatus())
      expect(result.current).toBe(INIT_STATUS.INITIALIZING)
    })
  })

  it('should return "SUCCEEDED" when response status code is 200', () => {
    ;(mockUseHealthQuery as jest.Mock).mockImplementation(({ onSuccess }) => {
      onSuccess({ status: 200 })

      const { result } = renderHook(() => useRobotInitializationStatus())
      expect(result.current).toBe(INIT_STATUS.SUCCEEDED)
    })
  })

  it('should return "FAILED" when response status code is 500', () => {
    ;(mockUseHealthQuery as jest.Mock).mockImplementation(({ onSuccess }) => {
      onSuccess({ status: 500 })

      const { result } = renderHook(() => useRobotInitializationStatus())
      expect(result.current).toBe(INIT_STATUS.FAILED)
    })
  })

  it('should return null when response status code is not 200, 500, or 503.', () => {
    ;(mockUseHealthQuery as jest.Mock).mockImplementation(({ onSuccess }) => {
      onSuccess({ status: 404 })
    })

    const { result } = renderHook(() => useRobotInitializationStatus())
    expect(result.current).toBeNull()
  })
})
