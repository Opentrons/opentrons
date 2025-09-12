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
  let mockStep: FormData
  let mockEnableConcurrentModuleActions: boolean

  beforeEach(() => {
    vi.clearAllMocks()
    mockEnableConcurrentModuleActions = false
    vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(
      mockEnableConcurrentModuleActions
    )

    mockStep = {
      stepType: 'pause',
      id: 'test-step-id',
      stepName: 'Custom Step Name',
    }
  })

  describe('text generation', () => {
    it('should return custom step name when stepName is provided', () => {
      const { result } = render(mockStep)
      expect(result.current.text).toBe('Custom Step Name')
    })

    it('should return step type translation when stepName is undefined', () => {
      mockStep = { ...mockStep, stepName: undefined }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('pause')
    })

    it('should return step type translation when stepName is empty string', () => {
      mockStep = { ...mockStep, stepName: '' }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('pause')
    })

    it('should handle different step types', () => {
      mockStep = { ...mockStep, stepType: 'moveLiquid', stepName: undefined }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('transfer')
    })

    it('should format step name with titleCase', () => {
      mockStep = { ...mockStep, stepName: 'custom step name' }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('Custom Step Name')
    })
  })

  describe('subtext generation', () => {
    beforeEach(() => {
      mockEnableConcurrentModuleActions = true
      vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(
        mockEnableConcurrentModuleActions
      )
    })

    it('should return null subtext when feature flag is disabled', () => {
      vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(false)
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        pauseAction: PAUSE_UNTIL_RESUME,
      }
      const { result } = render(mockStep)
      expect(result.current.subtext).toBeNull()
    })

    it('should return null subtext when step type is not pause', () => {
      mockStep = {
        ...mockStep,
        stepType: 'moveLiquid',
        pauseAction: PAUSE_UNTIL_RESUME,
      }
      const { result } = render(mockStep)
      expect(result.current.subtext).toBeNull()
    })

    it('should return untilResume subtext for PAUSE_UNTIL_RESUME action', () => {
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        pauseAction: PAUSE_UNTIL_RESUME,
      }
      const { result } = render(mockStep)
      expect(result.current.subtext).toBe('Until told to resume')
    })

    it('should return untilTemperature subtext for PAUSE_UNTIL_TEMP action', () => {
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        pauseAction: PAUSE_UNTIL_TEMP,
        pauseTemperature: '25',
      }
      const { result } = render(mockStep)
      expect(result.current.subtext).toBe('Until 25 °C reached')
    })

    it('should return forDuration subtext for PAUSE_UNTIL_TIME action', () => {
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        pauseAction: PAUSE_UNTIL_TIME,
        pauseTime: '01:30:45',
      }
      const { result } = render(mockStep)
      expect(result.current.subtext).toBe('For 01:30:45')
    })

    it('should handle different time formats in PAUSE_UNTIL_TIME', () => {
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        pauseAction: PAUSE_UNTIL_TIME,
        pauseTime: '2:15',
      }
      const { result } = render(mockStep)
      expect(result.current.subtext).toBe('For 02:15')
    })

    it('should return null subtext when pauseAction is undefined', () => {
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        pauseAction: undefined,
      }
      const { result } = render(mockStep)
      expect(result.current.subtext).toBeNull()
    })

    it('should return null subtext when pauseAction is not one of the expected values', () => {
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        pauseAction: 'unknownAction' as any,
      }
      const { result } = render(mockStep)
      expect(result.current.subtext).toBeNull()
    })
  })

  describe('integration tests', () => {
    it('should return both text and subtext for pause step with untilResume action', () => {
      mockEnableConcurrentModuleActions = true
      vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(
        mockEnableConcurrentModuleActions
      )
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        stepName: 'Custom Pause Step',
        pauseAction: PAUSE_UNTIL_RESUME,
      }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('Custom Pause Step')
      expect(result.current.subtext).toBe('Until told to resume')
    })

    it('should return both text and subtext for pause step with untilTemperature action', () => {
      mockEnableConcurrentModuleActions = true
      vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(
        mockEnableConcurrentModuleActions
      )
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        stepName: 'Temperature Pause',
        pauseAction: PAUSE_UNTIL_TEMP,
        pauseTemperature: '37',
      }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('Temperature Pause')
      expect(result.current.subtext).toBe('Until 37 °C reached')
    })

    it('should return both text and subtext for pause step with untilTime action', () => {
      mockEnableConcurrentModuleActions = true
      vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(
        mockEnableConcurrentModuleActions
      )
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        stepName: 'Timed Pause',
        pauseAction: PAUSE_UNTIL_TIME,
        pauseTime: '00:05:30',
      }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('Timed Pause')
      expect(result.current.subtext).toBe('For 00:05:30')
    })

    it('should return only text for non-pause step types', () => {
      mockStep = {
        ...mockStep,
        stepType: 'moveLiquid',
        stepName: 'Move Liquid Step',
      }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('Move Liquid Step')
      expect(result.current.subtext).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle step with minimal required properties', () => {
      mockStep = {
        stepType: 'comment',
        id: 'minimal-step',
      }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('comment')
      expect(result.current.subtext).toBeNull()
    })

    it('should handle step with empty stepName and pause action', () => {
      mockEnableConcurrentModuleActions = true
      vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(
        mockEnableConcurrentModuleActions
      )
      mockStep = {
        ...mockStep,
        stepName: '',
        stepType: 'pause',
        pauseAction: PAUSE_UNTIL_RESUME,
      }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('pause')
      expect(result.current.subtext).toBe('Until told to resume')
    })

    it('should handle step with null pauseTemperature', () => {
      mockEnableConcurrentModuleActions = true
      vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(
        mockEnableConcurrentModuleActions
      )
      mockStep = {
        ...mockStep,
        stepType: 'pause',
        pauseAction: PAUSE_UNTIL_TEMP,
        pauseTemperature: null,
      }
      const { result } = render(mockStep)
      expect(result.current.text).toBe('Custom Step Name')
      expect(result.current.subtext).toBe('Until  °C reached')
    })

  })
})
