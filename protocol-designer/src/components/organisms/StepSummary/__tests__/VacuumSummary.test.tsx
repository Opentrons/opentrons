import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
  VACUUM_STATE_PUMP_OFF,
  VACUUM_STATE_PUMP_ON,
  VACUUM_VENT_SET_CLOSED,
  VACUUM_VENT_SET_OPEN,
} from '@opentrons/step-generation'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { VacuumSummary } from '../VacuumSummary'

import type { FormData } from '/protocol-designer/form-types'

const baseStep: FormData = {
  id: 'step-id',
  stepType: 'vacuum',
  stepName: '',
  stepDetails: '',
  stepNumber: 0,
  moduleId: 'vacuum-module-id',
  programType: VACUUM_PROGRAM_STATE,
  stateType: null,
  modeType: null,
  pressureMbar: null,
  percentPower: null,
  pumpDurationCheckbox: null,
  pumpDurationTime: null,
  endingHoldVentCheckbox: false,
  vacuumOrderedProfileIds: [],
  vacuumProfileItemsById: {},
}

const render = (currentStep: FormData) => {
  return renderWithProviders(<VacuumSummary currentStep={currentStep} />, {
    i18nInstance: i18n,
  })
}

describe('VacuumSummary', () => {
  describe('vent state', () => {
    it('renders vent open summary', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_STATE,
        stateType: VACUUM_VENT_SET_OPEN,
      })
      expect(screen.getByText('Vent')).toBeInTheDocument()
      expect(screen.getByTestId('Tag_default')).toHaveTextContent('Open')
    })

    it('renders vent closed summary', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_STATE,
        stateType: VACUUM_VENT_SET_CLOSED,
      })
      expect(screen.getByText('Vent')).toBeInTheDocument()
      expect(screen.getByTestId('Tag_default')).toHaveTextContent('Closed')
    })
  })

  describe('pump state without duration', () => {
    it('renders pump power summary', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_STATE,
        stateType: VACUUM_STATE_PUMP_ON,
        modeType: VACUUM_MODE_POWER,
        percentPower: 75,
        pumpDurationCheckbox: false,
      })
      expect(screen.getByText('Set pump power to')).toBeInTheDocument()
      expect(screen.getByTestId('Tag_default')).toHaveTextContent('75%')
    })

    it('renders pump pressure summary', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_STATE,
        stateType: VACUUM_STATE_PUMP_ON,
        modeType: VACUUM_MODE_PRESSURE,
        pressureMbar: 200,
        pumpDurationCheckbox: false,
      })
      expect(screen.getByText('Set gauge pressure to')).toBeInTheDocument()
      expect(screen.getByTestId('Tag_default')).toHaveTextContent('200 mbar')
    })
  })

  describe('pump state with duration (end hold)', () => {
    it('renders pump power with duration and ending vent open', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_STATE,
        stateType: VACUUM_STATE_PUMP_ON,
        modeType: VACUUM_MODE_POWER,
        percentPower: 50,
        pumpDurationCheckbox: true,
        pumpDurationTime: '05:30',
        endingHoldVentCheckbox: true,
      })
      expect(screen.getByText(/Set pump power to/)).toBeInTheDocument()
      const tagElements = screen.getAllByTestId('Tag_default')
      expect(tagElements[0]).toHaveTextContent('50%')
      expect(tagElements[1]).toHaveTextContent('05:30')
      expect(tagElements[2]).toHaveTextContent('Open')
    })

    it('renders pump power with duration and ending vent closed', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_STATE,
        stateType: VACUUM_STATE_PUMP_ON,
        modeType: VACUUM_MODE_POWER,
        percentPower: 80,
        pumpDurationCheckbox: true,
        pumpDurationTime: '01:00',
        endingHoldVentCheckbox: false,
      })
      expect(screen.getByText(/Set pump power to/)).toBeInTheDocument()
      const tagElements = screen.getAllByTestId('Tag_default')
      expect(tagElements[0]).toHaveTextContent('80%')
      expect(tagElements[1]).toHaveTextContent('01:00')
      expect(tagElements[2]).toHaveTextContent('Closed')
    })

    it('renders pump pressure with duration', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_STATE,
        stateType: VACUUM_STATE_PUMP_ON,
        modeType: VACUUM_MODE_PRESSURE,
        pressureMbar: 100,
        pumpDurationCheckbox: true,
        pumpDurationTime: '02:45',
        endingHoldVentCheckbox: true,
      })
      expect(screen.getByText(/Set gauge pressure to/)).toBeInTheDocument()
      const tagElements = screen.getAllByTestId('Tag_default')
      expect(tagElements[0]).toHaveTextContent('100 mbar')
      expect(tagElements[1]).toHaveTextContent('02:45')
      expect(tagElements[2]).toHaveTextContent('Open')
    })
  })

  describe('profile', () => {
    it('renders profile summary with step count and ending vent open', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_PROFILE,
        stateType: null,
        vacuumOrderedProfileIds: ['p1', 'p2', 'p3'],
        endingHoldVentCheckbox: true,
      })
      expect(screen.getByText(/Run vacuum profile with/)).toBeInTheDocument()
      const tagElements = screen.getAllByTestId('Tag_default')
      expect(tagElements[0]).toHaveTextContent('3 steps')
      expect(tagElements[1]).toHaveTextContent('Open')
    })

    it('renders profile summary with step count (1) and ending vent closed', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_PROFILE,
        stateType: null,
        vacuumOrderedProfileIds: ['p1'],
        endingHoldVentCheckbox: false,
      })
      expect(screen.getByText(/Run vacuum profile with/)).toBeInTheDocument()
      const tagElements = screen.getAllByTestId('Tag_default')
      expect(tagElements[0]).toHaveTextContent('1 step')
      expect(tagElements[1]).toHaveTextContent('Closed')
    })

    it('renders profile summary with step count (multiple) and ending vent closed', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_PROFILE,
        stateType: null,
        vacuumOrderedProfileIds: ['p1', 'p2', 'p3'],
        endingHoldVentCheckbox: false,
      })
      expect(screen.getByText(/Run vacuum profile with/)).toBeInTheDocument()
      const tagElements = screen.getAllByTestId('Tag_default')
      expect(tagElements[0]).toHaveTextContent('3 steps')
      expect(tagElements[1]).toHaveTextContent('Closed')
    })
  })
  describe('pump state off', () => {
    it('renders pump off summary', () => {
      render({
        ...baseStep,
        programType: VACUUM_PROGRAM_STATE,
        stateType: VACUUM_STATE_PUMP_OFF,
      })
      expect(screen.getByText('Stop pump')).toBeInTheDocument()
    })
  })
})
