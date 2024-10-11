import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

import { OT2_ROBOT_TYPE, FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useDropTipLocations } from '../useDropTipLocations'

const TRASH_BIN_FIXTURE = 'trashBinAdapter'
const WASTE_CHUTE_FIXTURE_1 = 'wasteChuteRightAdapterNoCover'
const TRASH_BIN_CUTOUT = 'cutoutA2'
const WASTE_CHUTE_CUTOUT = 'cutoutA3'
const SLOT_A2 = 'A2'
const SLOT_A3 = 'A3'
const SLOT_FIXED_TRASH = 'fixedTrash'
const CHOOSE_DECK_LOCATION = 'CHOOSE_DECK_LOCATION'
const TRASH_BIN_LOCATION = 'trash-bin'
const WASTE_CHUTE_LOCATION = 'waste-chute'
const FIXED_TRASH_LOCATION = 'fixed-trash'
const DECK_LOCATION = 'deck'

vi.mock('/app/resources/deck_configuration')

describe('useDropTipLocations', () => {
  const mockDeckConfigFlex = [
    { cutoutFixtureId: TRASH_BIN_FIXTURE, cutoutId: TRASH_BIN_CUTOUT },
    { cutoutFixtureId: WASTE_CHUTE_FIXTURE_1, cutoutId: WASTE_CHUTE_CUTOUT },
  ]

  beforeEach(() => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: mockDeckConfigFlex,
    } as any)
  })

  it('should return correct locations for an OT-2', () => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [],
    } as any)

    const { result } = renderHook(() => useDropTipLocations(OT2_ROBOT_TYPE))

    expect(result.current).toEqual([
      { location: FIXED_TRASH_LOCATION, slotName: SLOT_FIXED_TRASH },
      { location: DECK_LOCATION, slotName: CHOOSE_DECK_LOCATION },
    ])
  })

  it('should return correct locations for a Flex', () => {
    const { result } = renderHook(() => useDropTipLocations(FLEX_ROBOT_TYPE))

    expect(result.current).toEqual([
      { location: TRASH_BIN_LOCATION, slotName: SLOT_A2 },
      { location: WASTE_CHUTE_LOCATION, slotName: SLOT_A3 },
      { location: DECK_LOCATION, slotName: CHOOSE_DECK_LOCATION },
    ])
  })

  it('should handle missing addressable areas for a Flex', () => {
    const { result } = renderHook(() => useDropTipLocations(FLEX_ROBOT_TYPE))

    expect(result.current).toEqual([
      { location: TRASH_BIN_LOCATION, slotName: SLOT_A2 },
      { location: WASTE_CHUTE_LOCATION, slotName: SLOT_A3 },
      { location: DECK_LOCATION, slotName: CHOOSE_DECK_LOCATION },
    ])
  })

  it('should handle an empty deck configuration for a Flex', () => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [],
    } as any)

    const { result } = renderHook(() => useDropTipLocations(FLEX_ROBOT_TYPE))

    expect(result.current).toEqual([
      { location: DECK_LOCATION, slotName: CHOOSE_DECK_LOCATION },
    ])
  })

  it('should handle an undefined deck configuration for an OT-2', () => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: undefined,
    } as any)

    const { result } = renderHook(() => useDropTipLocations(OT2_ROBOT_TYPE))

    expect(result.current).toEqual([
      { location: FIXED_TRASH_LOCATION, slotName: SLOT_FIXED_TRASH },
      { location: DECK_LOCATION, slotName: CHOOSE_DECK_LOCATION },
    ])
  })

  it('should handle an undefined deck configuration for a Flex', () => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: undefined,
    } as any)

    const { result } = renderHook(() => useDropTipLocations(FLEX_ROBOT_TYPE))

    expect(result.current).toEqual([
      { location: DECK_LOCATION, slotName: CHOOSE_DECK_LOCATION },
    ])
  })
})
