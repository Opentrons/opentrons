import { describe, it, vi, expect, beforeEach } from 'vitest'
import { renderHook, act, render, screen } from '@testing-library/react'
import { useTranslation } from 'react-i18next'

import { DROP_TIP_SPECIAL_ERROR_TYPES } from '../../constants'
import { useDropTipCommandErrors, useDropTipErrorComponents } from '../errors'

import type { Mock } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}))

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
        runCommandError: {
          errorType: DROP_TIP_SPECIAL_ERROR_TYPES.MUST_HOME_ERROR,
        } as any,
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
})

describe('useDropTipErrorComponents', () => {
  let t: Mock
  let mockHandleMustHome: Mock

  beforeEach(() => {
    mockHandleMustHome = vi.fn()
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
      })
    )

    render(result.current.subHeader)

    expect(result.current.button).toBeNull()
    screen.getByText(/drop_tip_failed/i)
    screen.getByText(/Some error message/i)
  })
})
