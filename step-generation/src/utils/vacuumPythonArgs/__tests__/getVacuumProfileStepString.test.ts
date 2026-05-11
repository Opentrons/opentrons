import { describe, expect, it } from 'vitest'

import { getVacuumProfileStepString } from '../getVacuumProfileStepString'

import type { VacuumProfile } from '@opentrons/shared-data'

describe('getVacuumProfileStepString', () => {
  it('formats a single atomic pressure step with repetitions=1', () => {
    const profile: VacuumProfile = [
      { enablePump: true, holdSeconds: 12, gaugePressureMbar: 55 },
    ]
    expect(getVacuumProfileStepString(profile, true)).toEqual([
      `profile=[
    {
        "gauge_pressure": 55,
        "hold_time_seconds": 12,
        "vent_after": True,
    }
]`,
      'repetitions=1',
    ])
  })

  it('formats a single atomic power step with repetitions=1', () => {
    const profile: VacuumProfile = [
      { enablePump: true, holdSeconds: 5, percentPower: 30 },
    ]
    expect(getVacuumProfileStepString(profile, true)).toEqual([
      `profile=[
    {
        "power_percent": 30,
        "hold_time_seconds": 5,
        "vent_after": True,
    }
]`,
      'repetitions=1',
    ])
  })

  it('flattens sole cycle into multiple atomic steps and sets repetitions to 1', () => {
    const profile: VacuumProfile = [
      {
        repetitions: 2,
        steps: [{ enablePump: true, holdSeconds: 5, percentPower: 30 }],
      },
    ]
    expect(getVacuumProfileStepString(profile, true)).toEqual([
      `profile=[
    {"power_percent": 30, "hold_time_seconds": 5},
    {
        "power_percent": 30,
        "hold_time_seconds": 5,
        "vent_after": True,
    }
]`,
      'repetitions=1',
    ])
  })

  it('flattens multiple top-level atomic steps and sets repetitions=1', () => {
    const profile: VacuumProfile = [
      { enablePump: true, holdSeconds: 1, gaugePressureMbar: 10 },
      { enablePump: true, holdSeconds: 2, gaugePressureMbar: 20 },
    ]
    expect(getVacuumProfileStepString(profile, true)).toEqual([
      `profile=[
    {"gauge_pressure": 10, "hold_time_seconds": 1},
    {
        "gauge_pressure": 20,
        "hold_time_seconds": 2,
        "vent_after": True,
    }
]`,
      'repetitions=1',
    ])
  })

  it('expands a cycle by repetitions when not sole top-level cycle', () => {
    const profile: VacuumProfile = [
      { enablePump: true, holdSeconds: 1, gaugePressureMbar: 100 },
      {
        repetitions: 2,
        steps: [{ enablePump: true, holdSeconds: 5, percentPower: 30 }],
      },
    ]
    expect(getVacuumProfileStepString(profile, true)).toEqual([
      `profile=[
    {"gauge_pressure": 100, "hold_time_seconds": 1},
    {"power_percent": 30, "hold_time_seconds": 5},
    {
        "power_percent": 30,
        "hold_time_seconds": 5,
        "vent_after": True,
    }
]`,
      'repetitions=1',
    ])
  })

  it('flattens sole cycle with multiple inner steps and outer repetitions', () => {
    const profile: VacuumProfile = [
      {
        repetitions: 2,
        steps: [
          { enablePump: true, holdSeconds: 1, gaugePressureMbar: 1 },
          {
            enablePump: true,
            holdSeconds: 2,
            percentPower: 50,
            ventAfter: true,
          },
        ],
      },
    ]
    expect(getVacuumProfileStepString(profile, true)).toEqual([
      `profile=[
    {"gauge_pressure": 1, "hold_time_seconds": 1},
    {"power_percent": 50, "hold_time_seconds": 2},
    {"gauge_pressure": 1, "hold_time_seconds": 1},
    {
        "power_percent": 50,
        "hold_time_seconds": 2,
        "vent_after": True,
    }
]`,
      'repetitions=1',
    ])
  })
})
