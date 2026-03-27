import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getEmptyDeckConfiguration,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'

import { useMemoizedUpdatedDeckConfig } from '../useMemoizedUpdatedDeckConfig'

import type { FormModules } from '/protocol-designer/step-forms'
import type { Fixtures } from '../../../types'

const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

describe('useMemoizedUpdatedDeckConfig', () => {
  it('matches getEmptyDeckConfiguration when modules and fixtures are empty', () => {
    const modules: FormModules = {}
    const fixtures: Fixtures = {}
    const expected = getEmptyDeckConfiguration(deckDef)

    const { result } = renderHook(() =>
      useMemoizedUpdatedDeckConfig(modules, fixtures)
    )

    expect(result.current).toEqual(expected)
  })

  it('returns the same array reference when modules and fixtures references are unchanged', () => {
    const modules: FormModules = {}
    const fixtures: Fixtures = {}

    const { result, rerender } = renderHook(() =>
      useMemoizedUpdatedDeckConfig(modules, fixtures)
    )
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })

  it('recomputes when modules reference changes', () => {
    const fixtures: Fixtures = {}
    let modules: FormModules = {}

    const { result, rerender } = renderHook(
      ({ mods, fix }: { mods: FormModules; fix: Fixtures }) =>
        useMemoizedUpdatedDeckConfig(mods, fix),
      { initialProps: { mods: modules, fix: fixtures } }
    )
    const emptyConfig = result.current

    modules = {
      1: {
        model: HEATERSHAKER_MODULE_V1,
        type: HEATERSHAKER_MODULE_TYPE,
        slot: 'D1',
        cutoutFixtureId: null,
        cutoutId: null,
      },
    }
    rerender({ mods: modules, fix: fixtures })

    expect(result.current).not.toBe(emptyConfig)
    const d1 = result.current.find(c => c.cutoutId === 'cutoutD1')
    expect(d1?.cutoutFixtureId).toBe('heaterShakerModuleV1')
  })

  it('applies fixture cutout configuration', () => {
    const modules: FormModules = {}
    const fixtures: Fixtures = {
      staging1: {
        cutoutId: 'cutoutA3',
        name: 'stagingArea',
        cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
      },
    }

    const { result } = renderHook(() =>
      useMemoizedUpdatedDeckConfig(modules, fixtures)
    )

    const a3 = result.current.find(c => c.cutoutId === 'cutoutA3')
    expect(a3?.cutoutFixtureId).toBe(STAGING_AREA_RIGHT_SLOT_FIXTURE)
  })

  it('applies module cutout configuration', () => {
    const modules: FormModules = {
      '1': {
        model: HEATERSHAKER_MODULE_V1,
        type: HEATERSHAKER_MODULE_TYPE,
        slot: 'D1',
        cutoutFixtureId: null,
        cutoutId: null,
      },
    }
    const fixtures: Fixtures = {}

    const { result } = renderHook(() =>
      useMemoizedUpdatedDeckConfig(modules, fixtures)
    )

    const d1 = result.current.find(c => c.cutoutId === 'cutoutD1')
    expect(d1?.cutoutFixtureId).toBe(HEATERSHAKER_MODULE_V1)
  })
})
