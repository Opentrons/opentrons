import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderHook } from '@testing-library/react'

import { getProviderWrapperForHooks } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import {
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TEMP,
  PAUSE_UNTIL_TIME,
} from '/protocol-designer/constants'
import { getEnableConcurrentModuleActions } from '/protocol-designer/feature-flags/selectors'

import { useStepText } from '../useStepText'

import type { FormData } from '/protocol-designer/form-types'

vi.mock('/protocol-designer/feature-flags/selectors')

const wrapper = getProviderWrapperForHooks({}, i18n)

const render = (step: FormData) => {
  return renderHook(() => useStepText(step), { wrapper })
}

describe('useStepText', () => {
  it('should return custom step name when stepName is provided', () => {
    const mockStep: FormData = {
      stepType: 'pause',
      id: 'test-step-id',
      stepName: 'Custom Step Name',
    }
    vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(false)
    const { result } = render(mockStep)
    expect(result.current).toStrictEqual({
      text: 'Custom Step Name',
      subtext: null,
    })
  })

  it('should return a default step name when stepName is undefined', () => {
    const mockStep: FormData = {
      stepType: 'absorbanceReader',
      id: 'test-step-id',
      stepName: undefined,
    }
    vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(false)
    const { result } = render(mockStep)
    expect(result.current).toStrictEqual({
      text: 'absorbance plate reader',
      subtext: null,
    })
  })

  it('should return a default step name when stepName is the empty string', () => {
    const mockStep: FormData = {
      stepType: 'absorbanceReader',
      id: 'test-step-id',
      stepName: '',
    }
    vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(false)
    const { result } = render(mockStep)
    expect(result.current).toStrictEqual({
      text: 'absorbance plate reader',
      subtext: null,
    })
  })

  it('should return null subtext when feature flag is disabled', () => {
    const mockStep: FormData = {
      stepType: 'pause',
      id: 'test-step-id',
      stepName: 'Custom Step Name',
      pauseAction: PAUSE_UNTIL_RESUME,
    }
    vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(false)
    const { result } = render(mockStep)
    expect(result.current).toStrictEqual({
      text: 'Custom Step Name',
      subtext: null,
    })
  })

  it('should return null subtext when step type is not pause', () => {
    const mockStep: FormData = {
      stepType: 'moveLiquid',
      id: 'test-step-id',
      stepName: 'Custom Step Name',
      pauseAction: PAUSE_UNTIL_RESUME,
    }
    vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(true)
    const { result } = render(mockStep)
    expect(result.current).toStrictEqual({
      text: 'Custom Step Name',
      subtext: null,
    })
  })

  it('should return untilResume subtext for PAUSE_UNTIL_RESUME action', () => {
    const mockStep: FormData = {
      stepType: 'pause',
      id: 'test-step-id',
      stepName: 'Custom Step Name',
      pauseAction: PAUSE_UNTIL_RESUME,
    }
    vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(true)
    const { result } = render(mockStep)
    expect(result.current).toStrictEqual({
      text: 'Custom Step Name',
      subtext: 'Until told to resume',
    })
  })

  it('should return untilTemperature subtext for PAUSE_UNTIL_TEMP action', () => {
    const mockStep: FormData = {
      stepType: 'pause',
      id: 'test-step-id',
      stepName: 'Custom Step Name',
      pauseAction: PAUSE_UNTIL_TEMP,
      pauseTemperature: '25',
    }
    vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(true)
    const { result } = render(mockStep)
    expect(result.current).toStrictEqual({
      text: 'Custom Step Name',
      subtext: 'Until 25 °C reached',
    })
  })

  it('should return forDuration subtext for PAUSE_UNTIL_TIME action', () => {
    const mockStep: FormData = {
      stepType: 'pause',
      id: 'test-step-id',
      stepName: 'Custom Step Name',
      pauseAction: PAUSE_UNTIL_TIME,
      pauseTime: '1:2:34',
    }
    vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(true)
    const { result } = render(mockStep)
    expect(result.current).toStrictEqual({
      text: 'Custom Step Name',
      subtext: 'For 01:02:34',
    })
  })
})
