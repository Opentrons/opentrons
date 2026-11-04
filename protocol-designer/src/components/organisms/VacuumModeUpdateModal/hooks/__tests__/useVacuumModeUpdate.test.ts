import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
} from '@opentrons/step-generation'

import { useVacuumModeUpdate } from '../../hooks/useVacuumModeUpdate'

import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/types'

const createPropsForFields = (): FieldPropsByName =>
  ({
    vacuumOrderedProfileIds: { updateValue: vi.fn() },
    vacuumProfileItemsById: { updateValue: vi.fn() },
    modeType: { updateValue: vi.fn() },
  }) as unknown as FieldPropsByName

// helper to create a form data object for a vacuum step with a profile
const createVacuumFormData = (overrides: Partial<FormData> = {}): FormData =>
  ({
    stepType: 'vacuum',
    id: 'step-1',
    vacuumOrderedProfileIds: ['profile-1'],
    vacuumProfileItemsById: {
      'profile-1': {
        type: 'profileStep',
        id: 'profile-1',
        title: 'Step 1',
        time: '1:00',
        pumpData: { mode: VACUUM_MODE_PRESSURE, pressureMbar: '100' },
      },
    },
    modeType: VACUUM_MODE_PRESSURE,
    programType: 'profile',
    stateType: null,
    moduleId: 'module-1',
    ...overrides,
  }) as FormData

describe('useVacuumModeUpdate', () => {
  describe('showVacuumModeUpdateModal', () => {
    it('returns false when step type is not vacuum', () => {
      const formData = createVacuumFormData({ stepType: 'moveLabware' })
      const propsForFields = createPropsForFields()

      const { result } = renderHook(() =>
        useVacuumModeUpdate(formData, propsForFields)
      )

      expect(result.current.showVacuumModeUpdateModal).toBe(false)
    })

    it('returns false when vacuum step has no profile (empty vacuumOrderedProfileIds)', () => {
      const formData = createVacuumFormData({ vacuumOrderedProfileIds: [] })
      const propsForFields = createPropsForFields()

      const { result } = renderHook(() =>
        useVacuumModeUpdate(formData, propsForFields)
      )

      expect(result.current.showVacuumModeUpdateModal).toBe(false)
    })

    it('returns false when saved profile mode matches current form modeType', () => {
      const formData = createVacuumFormData({ modeType: VACUUM_MODE_PRESSURE })
      const propsForFields = createPropsForFields()

      const { result } = renderHook(() =>
        useVacuumModeUpdate(formData, propsForFields)
      )

      expect(result.current.showVacuumModeUpdateModal).toBe(false)
    })

    it('returns true when vacuum has profile and modeType differs from saved profile mode', () => {
      const formData = createVacuumFormData({ modeType: VACUUM_MODE_POWER })
      const propsForFields = createPropsForFields()

      const { result } = renderHook(() =>
        useVacuumModeUpdate(formData, propsForFields)
      )

      expect(result.current.showVacuumModeUpdateModal).toBe(true)
    })

    it('returns false when saved profile mode cannot be determined (null)', () => {
      const formData = createVacuumFormData({
        vacuumOrderedProfileIds: ['profile-1'],
        vacuumProfileItemsById: {},
        modeType: VACUUM_MODE_POWER,
      })
      const propsForFields = createPropsForFields()

      const { result } = renderHook(() =>
        useVacuumModeUpdate(formData, propsForFields)
      )

      expect(result.current.showVacuumModeUpdateModal).toBe(false)
    })
  })

  describe('handleConfirmVacuumModeUpdate', () => {
    it('resets profile to defaults and closes modal when vacuum with profile', () => {
      const formData = createVacuumFormData({ modeType: VACUUM_MODE_POWER })
      const propsForFields = createPropsForFields()

      const { result } = renderHook(() =>
        useVacuumModeUpdate(formData, propsForFields)
      )

      expect(result.current.showVacuumModeUpdateModal).toBe(true)
      const handleConfirm = (
        result.current as {
          handleConfirmVacuumModeUpdate: () => void
        }
      ).handleConfirmVacuumModeUpdate

      act(() => {
        handleConfirm()
      })

      expect(
        propsForFields.vacuumOrderedProfileIds.updateValue
      ).toHaveBeenCalledWith([])
      expect(
        propsForFields.vacuumProfileItemsById.updateValue
      ).toHaveBeenCalledWith({})
      expect(result.current.showVacuumModeUpdateModal).toBe(false)
    })

    it('does not expose handleConfirmVacuumModeUpdate when not vacuum with profile', () => {
      const formData = createVacuumFormData({
        stepType: 'moveLabware',
        vacuumOrderedProfileIds: [],
      })
      const propsForFields = createPropsForFields()

      const { result } = renderHook(() =>
        useVacuumModeUpdate(formData, propsForFields)
      )

      expect(result.current.showVacuumModeUpdateModal).toBe(false)
      expect('handleConfirmVacuumModeUpdate' in result.current).toBe(false)
    })
  })

  describe('handleCancelVacuumModeUpdate', () => {
    it('restores saved modeType and closes modal when vacuum with profile', () => {
      const formData = createVacuumFormData({ modeType: VACUUM_MODE_POWER })
      const propsForFields = createPropsForFields()

      const { result } = renderHook(() =>
        useVacuumModeUpdate(formData, propsForFields)
      )

      expect(result.current.showVacuumModeUpdateModal).toBe(true)
      const handleCancel = (
        result.current as {
          handleCancelVacuumModeUpdate: () => void
        }
      ).handleCancelVacuumModeUpdate

      act(() => {
        handleCancel()
      })

      expect(propsForFields.modeType.updateValue).toHaveBeenCalledWith(
        VACUUM_MODE_PRESSURE
      )
      expect(result.current.showVacuumModeUpdateModal).toBe(false)
    })

    it('does not expose handleCancelVacuumModeUpdate when not vacuum with profile', () => {
      const formData = createVacuumFormData({ stepType: 'moveLabware' })
      const propsForFields = createPropsForFields()

      const { result } = renderHook(() =>
        useVacuumModeUpdate(formData, propsForFields)
      )

      expect(result.current.showVacuumModeUpdateModal).toBe(false)
      expect('handleCancelVacuumModeUpdate' in result.current).toBe(false)
    })

    it('does not expose handleCancelVacuumModeUpdate when saved profile mode is null', () => {
      // firstProfileItem is undefined when vacuumProfileItemsById is empty, modal never shows
      const formData = createVacuumFormData({
        vacuumOrderedProfileIds: ['profile-1'],
        vacuumProfileItemsById: {},
      })
      const propsForFields = createPropsForFields()

      const { result } = renderHook(() =>
        useVacuumModeUpdate(formData, propsForFields)
      )

      expect(result.current.showVacuumModeUpdateModal).toBe(false)
      expect('handleCancelVacuumModeUpdate' in result.current).toBe(false)
    })
  })
})
