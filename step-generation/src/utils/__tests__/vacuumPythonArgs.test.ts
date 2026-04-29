import { describe, expect, it } from 'vitest'

import {
  getVacuumProfileStepString,
  getVacuumPumpHoldArgsPython,
} from '../vacuumPythonArgs'

import type { VacuumProfile } from '@opentrons/shared-data'

describe('getVacuumPumpHoldArgsPython', () => {
  it('emits duration only when ventAfter is omitted', () => {
    expect(getVacuumPumpHoldArgsPython(30)).toEqual(['duration=30'])
  })

  it('emits duration and vent_after when ventAfter is true', () => {
    expect(getVacuumPumpHoldArgsPython(10, true)).toEqual([
      'duration=10',
      'vent_after=True',
    ])
  })

  it('emits duration and vent_after when ventAfter is false', () => {
    expect(getVacuumPumpHoldArgsPython(10, false)).toEqual([
      'duration=10',
      'vent_after=False',
    ])
  })

  it('formats non-integer duration like Python numbers', () => {
    expect(getVacuumPumpHoldArgsPython(1.5)).toEqual(['duration=1.5'])
  })
})

describe('getVacuumProfileStepString', () => {
  const indentedPressureStep =
    '    {"gauge_pressure": 55, "hold_time_seconds": 12}'
  const indentedPowerStep = '    {"power_percent": 30, "hold_time_seconds": 5}'

  it('formats a single atomic pressure step with repetitions=1', () => {
    const profile: VacuumProfile = [{ holdSeconds: 12, pressureMbar: 55 }]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `profile=[\n${indentedPressureStep}\n]`,
      'repetitions=1',
    ])
  })

  it('formats a single atomic power step with repetitions=1', () => {
    const profile: VacuumProfile = [{ holdSeconds: 5, powerPercent: 30 }]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `profile=[\n${indentedPowerStep}\n]`,
      'repetitions=1',
    ])
  })

  it('formats sole cycle using inner steps once and cycle repetitions', () => {
    const profile: VacuumProfile = [
      {
        repetitions: 2,
        steps: [{ holdSeconds: 5, powerPercent: 30 }],
      },
    ]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `profile=[\n${indentedPowerStep}\n]`,
      'repetitions=2',
    ])
  })

  it('flattens multiple top-level atomic steps and sets repetitions=1', () => {
    const profile: VacuumProfile = [
      { holdSeconds: 1, pressureMbar: 10 },
      { holdSeconds: 2, pressureMbar: 20 },
    ]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `profile=[\n    {"gauge_pressure": 10, "hold_time_seconds": 1},\n    {"gauge_pressure": 20, "hold_time_seconds": 2}\n]`,
      'repetitions=1',
    ])
  })

  it('expands a cycle by repetitions when not sole top-level cycle', () => {
    const profile: VacuumProfile = [
      { holdSeconds: 1, pressureMbar: 100 },
      {
        repetitions: 2,
        steps: [{ holdSeconds: 5, powerPercent: 30 }],
      },
    ]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `profile=[\n    {"gauge_pressure": 100, "hold_time_seconds": 1},\n    {"power_percent": 30, "hold_time_seconds": 5},\n    {"power_percent": 30, "hold_time_seconds": 5}\n]`,
      'repetitions=1',
    ])
  })

  it('formats sole cycle with multiple inner steps and outer repetitions', () => {
    const profile: VacuumProfile = [
      {
        repetitions: 2,
        steps: [
          { holdSeconds: 1, pressureMbar: 1 },
          { holdSeconds: 2, powerPercent: 50 },
        ],
      },
    ]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `profile=[\n    {"gauge_pressure": 1, "hold_time_seconds": 1},\n    {"power_percent": 50, "hold_time_seconds": 2}\n]`,
      'repetitions=2',
    ])
  })
})
