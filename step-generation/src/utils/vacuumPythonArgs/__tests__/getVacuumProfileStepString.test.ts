import { describe, expect, it } from 'vitest'

import { getVacuumProfileStepString } from '../getVacuumProfileStepString'

import type { VacuumProfile } from '@opentrons/shared-data'

describe('getVacuumProfileStepString', () => {
  it('formats a single atomic pressure step with repetitions=1', () => {
    const profile: VacuumProfile = [
      {
        enablePump: true,
        holdSeconds: 12,
        gaugePressureMbar: 55,
        ventAfter: false,
      },
    ]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `steps=[
    {
        "gauge_pressure_mbar": 55,
        "enable_pump": True,
        "hold_time_seconds": 12,
        "vent_after": False,
    }
]`,
      'repetitions=1',
    ])
  })

  it('formats a single atomic power step with repetitions=1', () => {
    const profile: VacuumProfile = [
      { enablePump: true, holdSeconds: 5, percentPower: 30, ventAfter: false },
    ]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `steps=[
    {
        "percent_power": 30,
        "enable_pump": True,
        "hold_time_seconds": 5,
        "vent_after": False,
    }
]`,
      'repetitions=1',
    ])
  })

  it('flattens sole cycle into multiple atomic steps and sets repetitions to 1', () => {
    const profile: VacuumProfile = [
      {
        repetitions: 2,
        steps: [
          {
            enablePump: true,
            holdSeconds: 5,
            gaugePressureMbar: 30,
            ventAfter: false,
          },
        ],
      },
    ]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `steps=[
    {
        "gauge_pressure_mbar": 30,
        "enable_pump": True,
        "hold_time_seconds": 5,
        "vent_after": False,
    }
]`,
      'repetitions=2',
    ])
  })

  it('flattens multiple top-level atomic steps and sets repetitions=1', () => {
    const profile: VacuumProfile = [
      {
        enablePump: true,
        holdSeconds: 1,
        gaugePressureMbar: 10,
        ventAfter: false,
      },
      {
        enablePump: true,
        holdSeconds: 2,
        gaugePressureMbar: 20,
        ventAfter: false,
      },
    ]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `steps=[
    {
        "gauge_pressure_mbar": 10,
        "enable_pump": True,
        "hold_time_seconds": 1,
        "vent_after": False,
    },
    {
        "gauge_pressure_mbar": 20,
        "enable_pump": True,
        "hold_time_seconds": 2,
        "vent_after": False,
    }
]`,
      'repetitions=1',
    ])
  })

  it('expands a cycle by repetitions when not sole top-level cycle', () => {
    const profile: VacuumProfile = [
      {
        enablePump: true,
        holdSeconds: 1,
        gaugePressureMbar: 100,
        ventAfter: false,
      },
      {
        repetitions: 2,
        steps: [
          {
            enablePump: true,
            holdSeconds: 5,
            percentPower: 30,
            ventAfter: false,
          },
        ],
      },
    ]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `steps=[
    {
        "gauge_pressure_mbar": 100,
        "enable_pump": True,
        "hold_time_seconds": 1,
        "vent_after": False,
    },
    {
        "percent_power": 30,
        "enable_pump": True,
        "hold_time_seconds": 5,
        "vent_after": False,
    },
    {
        "percent_power": 30,
        "enable_pump": True,
        "hold_time_seconds": 5,
        "vent_after": False,
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
          {
            enablePump: true,
            holdSeconds: 1,
            gaugePressureMbar: 1,
            ventAfter: false,
          },
          {
            enablePump: true,
            holdSeconds: 2,
            percentPower: 50,
            ventAfter: true,
          },
        ],
      },
    ]
    expect(getVacuumProfileStepString(profile)).toEqual([
      `steps=[
    {
        "gauge_pressure_mbar": 1,
        "enable_pump": True,
        "hold_time_seconds": 1,
        "vent_after": False,
    },
    {
        "percent_power": 50,
        "enable_pump": True,
        "hold_time_seconds": 2,
        "vent_after": True,
    }
]`,
      'repetitions=2',
    ])
  })
})
