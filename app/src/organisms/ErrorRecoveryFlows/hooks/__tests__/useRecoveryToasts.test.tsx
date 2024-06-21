import * as React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '../../../../i18n'
import { renderHook, render, screen } from '@testing-library/react'
import {
  useRecoveryToasts,
  useToastText,
  getStepNumber,
} from '../useRecoveryToasts'
import { RECOVERY_MAP } from '../../constants'
import { useToaster } from '../../../ToasterOven'

import type { Mock } from 'vitest'

vi.mock('../../../ToasterOven')

let mockMakeToast: Mock

describe('useRecoveryToasts', () => {
  beforeEach(() => {
    mockMakeToast = vi.fn()
    vi.mocked(useToaster).mockReturnValue({ makeToast: mockMakeToast } as any)
  })

  it('should return makeSuccessToast function', () => {
    const { result } = renderHook(() =>
      useRecoveryToasts({
        isOnDevice: false,
        currentStepCount: 1,
        selectedRecoveryOption: RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE,
      })
    )

    expect(result.current.makeSuccessToast).toBeInstanceOf(Function)
  })

  it(`should not make toast for ${RECOVERY_MAP.CANCEL_RUN.ROUTE} option`, () => {
    const { result } = renderHook(() =>
      useRecoveryToasts({
        isOnDevice: false,
        currentStepCount: 1,
        selectedRecoveryOption: RECOVERY_MAP.CANCEL_RUN.ROUTE,
      })
    )

    const mockMakeToast = vi.fn()
    vi.mocked(useToaster).mockReturnValue({ makeToast: mockMakeToast } as any)

    result.current.makeSuccessToast()
    expect(mockMakeToast).not.toHaveBeenCalled()
  })
})

describe('useToastText', () => {
  it(`should return correct text for ${RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE} option`, () => {
    const { result } = renderHook(() =>
      useToastText({
        currentStepCount: 2,
        selectedRecoveryOption: RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE,
      })
    )

    render(
      <I18nextProvider i18n={i18n}>
        <div>{result.current}</div>
      </I18nextProvider>
    )
    screen.getByText('Retrying step 2 succeeded')
  })

  it(`should return correct text for ${RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE} option`, () => {
    const { result } = renderHook(() =>
      useToastText({
        currentStepCount: 2,
        selectedRecoveryOption: RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE,
      })
    )

    render(
      <I18nextProvider i18n={i18n}>
        <div>{result.current}</div>
      </I18nextProvider>
    )
    screen.getByText('Skipping to step 3 succeeded')
  })

  it('should handle a falsy currentStepCount', () => {
    const { result } = renderHook(() =>
      useToastText({
        currentStepCount: null,
        selectedRecoveryOption: RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE,
      })
    )

    render(
      <I18nextProvider i18n={i18n}>
        <div>{result.current}</div>
      </I18nextProvider>
    )
    screen.getByText('Retrying step ? succeeded')
  })
})

describe('getStepNumber', () => {
  it(`should return current step for ${RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE} option`, () => {
    expect(getStepNumber(RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE, 3)).toBe(3)
  })

  it(`should return next step for ${RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE} option`, () => {
    expect(getStepNumber(RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE, 3)).toBe(
      4
    )
  })

  it('should handle a falsy currentStepCount', () => {
    expect(getStepNumber(RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE, null)).toBe('?')
  })

  it('should handle unknown recovery option', () => {
    expect(getStepNumber('UNKNOWN_OPTION' as any, 3)).toBe(
      'HANDLE RECOVERY TOAST OPTION EXPLICITLY.'
    )
  })
})
