import { useTranslation } from 'react-i18next'
import { act, render, renderHook, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DROP_TIP_SPECIAL_ERROR_TYPES } from '../../constants'
import {
  getDoorOpenErrorDetails,
  useDropTipCommandErrors,
  useDropTipErrorComponents,
} from '../errors'

import type { Mock } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
  initReactI18next: vi.fn(),
}))
vi.mock('i18next', () => {
  return {
    default: {
      use: () => ({ init: vi.fn() }),
      createInstance: () => ({
        use: () => ({ init: vi.fn() }),
        init: vi.fn(),
        t: (k: string) => k,
      }),
      init: vi.fn(),
      t: (k: string) => k,
    },
  }
})

describe('useDropTipCommandErrors', () => {
  let setErrorDetails: Mock
  let t: Mock

  beforeEach(() => {
    setErrorDetails = vi.fn()
    t = vi.fn(key => key)

    vi.mocked(useTranslation).mockReturnValue({ t } as any)
  })

  it('should set special error details for MUST_HOME_ERROR', () => {
    const { result } = renderHook(() =>
      useDropTipCommandErrors(setErrorDetails)
    )

    act(() => {
      result.current({
        type: DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR,
        message: 'remove_the_tips_manually',
        header: 'cant_safely_drop_tips',
      })
    })

    expect(setErrorDetails).toHaveBeenCalledWith({
      header: 'cant_safely_drop_tips',
      message: 'remove_the_tips_manually',
      type: DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR,
    })
  })

  it('should set generic error details for other error types', () => {
    const { result } = renderHook(() =>
      useDropTipCommandErrors(setErrorDetails)
    )

    act(() => {
      result.current({
        message: 'Some error message',
        header: 'Some error header',
        type: 'MOCK_ERROR',
      })
    })

    expect(setErrorDetails).toHaveBeenCalledWith({
      header: 'Some error header',
      message: 'Some error message',
      type: 'MOCK_ERROR',
    })
  })

  it('should set door-open error details for DOOR_OPEN_ERROR', () => {
    const { result } = renderHook(() =>
      useDropTipCommandErrors(setErrorDetails)
    )

    act(() => {
      result.current({
        type: DROP_TIP_SPECIAL_ERROR_TYPES.DOOR_OPEN_ERROR,
        message: null,
      })
    })

    expect(setErrorDetails).toHaveBeenCalledWith({
      header: 'door_is_open',
      message: 'close_door_and_try_again',
      type: DROP_TIP_SPECIAL_ERROR_TYPES.DOOR_OPEN_ERROR,
    })
  })
})

describe('useDropTipErrorComponents', () => {
  let t: Mock
  let mockHandleMustHome: Mock
  let mockHandleClearError: Mock

  beforeEach(() => {
    mockHandleMustHome = vi.fn()
    mockHandleClearError = vi.fn()
    t = vi.fn(key => key)

    vi.mocked(useTranslation).mockReturnValue({ t } as any)
  })

  it('should return special components for MUST_HOME_ERROR', () => {
    const { result } = renderHook(() =>
      useDropTipErrorComponents({
        isOnDevice: true,
        errorDetails: {
          type: DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR,
          message: 'Some error message',
        },
        handleMustHome: mockHandleMustHome,
        handleClearError: mockHandleClearError,
      })
    )

    render(result.current.subHeader)

    expect(result.current.button).toBeDefined()
    screen.getByText('Some error message')
  })

  it('should return generic components for other error types', () => {
    const { result } = renderHook(() =>
      useDropTipErrorComponents({
        isOnDevice: false,
        errorDetails: {
          type: 'MOCK_OTHER_ERROR',
          message: 'Some error message',
        },
        handleMustHome: mockHandleMustHome,
        handleClearError: mockHandleClearError,
      })
    )

    render(result.current.subHeader)

    expect(result.current.button).toBeNull()
    screen.getByText(/drop_tip_failed/i)
    screen.getByText(/Some error message/i)
  })

  it('should return door-open components for DOOR_OPEN_ERROR', () => {
    const { result } = renderHook(() =>
      useDropTipErrorComponents({
        isOnDevice: false,
        errorDetails: {
          type: DROP_TIP_SPECIAL_ERROR_TYPES.DOOR_OPEN_ERROR,
          message: 'Close the door and try again.',
        },
        handleMustHome: mockHandleMustHome,
        handleClearError: mockHandleClearError,
      })
    )

    render(result.current.subHeader)

    expect(result.current.button).toBeDefined()
    screen.getByText('Close the door and try again.')
  })
})

describe('getDoorOpenErrorDetails', () => {
  const mockDoorOpenError = (): unknown => ({
    isAxiosError: true,
    message: 'Request failed with status code 409',
    response: {
      status: 409,
      data: {
        errors: [
          {
            id: 'MaintenanceCommandDoorOpen',
            title: 'Door Open',
            detail: 'closed.',
          },
        ],
      },
    },
  })

  it('returns door-open params for a 409 MaintenanceCommandDoorOpen error', () => {
    const result = getDoorOpenErrorDetails(mockDoorOpenError())
    expect(result).toEqual({
      type: DROP_TIP_SPECIAL_ERROR_TYPES.DOOR_OPEN_ERROR,
      message: null,
    })
  })

  it('returns null for a plain Error', () => {
    expect(getDoorOpenErrorDetails(new Error('boom'))).toBeNull()
  })
})
