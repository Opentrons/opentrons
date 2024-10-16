import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDispatch, useSelector } from 'react-redux'

import { getRequests, dismissAllRequests } from '/app/redux/robot-api'
import { useCalibrationError } from '/app/organisms/Desktop/CalibrationError'

vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}))

vi.mock('/app/redux/robot-api', () => ({
  dismissAllRequests: vi.fn(),
  getRequests: vi.fn(),
}))

describe('useCalibrationError', () => {
  const mockDispatch = vi.fn()
  const mockRequestIds = ['req1', 'req2']
  const mockSessionId = 'session1'

  beforeEach(() => {
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useSelector).mockImplementation(selector => selector({} as any))
    vi.mocked(getRequests).mockReturnValue([])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return null when there are no errored requests', () => {
    const { result } = renderHook(() =>
      useCalibrationError(mockRequestIds, mockSessionId)
    )
    expect(result.current).toBeNull()
  })

  it('should dispatch dismissAllRequests when sessionId is provided', () => {
    renderHook(() => useCalibrationError(mockRequestIds, mockSessionId))
    expect(mockDispatch).toHaveBeenCalledWith(dismissAllRequests())
  })

  it('should return error info when there is an errored request with errors', () => {
    vi.mocked(getRequests).mockReturnValue([
      {
        status: 'failure',
        error: {
          errors: [{ title: 'Test Error', detail: 'Test Detail' }],
        },
      },
    ] as any)

    const { result } = renderHook(() =>
      useCalibrationError(mockRequestIds, mockSessionId)
    )
    expect(result.current).toEqual({
      title: 'Test Error',
      subText: 'Test Detail',
    })
  })

  it('should return error info when there is an errored request with message', () => {
    vi.mocked(getRequests).mockReturnValue([
      {
        status: 'failure',
        error: {
          message: 'Test Message',
        },
      },
    ] as any)

    const { result } = renderHook(() =>
      useCalibrationError(mockRequestIds, mockSessionId)
    )
    expect(result.current).toEqual({
      title: 'robot_calibration:error',
      subText: 'Test Message',
    })
  })

  it('should return default error info when error details are missing', () => {
    vi.mocked(getRequests).mockReturnValue([
      {
        status: 'failure',
        error: {},
      },
    ] as any)

    const { result } = renderHook(() =>
      useCalibrationError(mockRequestIds, mockSessionId)
    )
    expect(result.current).toEqual({
      title: 'robot_calibration:error',
      subText: 'branded:unexpected_error',
    })
  })
})
