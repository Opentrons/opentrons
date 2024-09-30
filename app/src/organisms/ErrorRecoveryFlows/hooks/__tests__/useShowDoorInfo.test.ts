import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useShowDoorInfo } from '../useShowDoorInfo'
import {
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_AWAITING_RECOVERY,
} from '@opentrons/api-client'

import { RECOVERY_MAP } from '../../constants'

import type { IRecoveryMap } from '../../types'

describe('useShowDoorInfo', () => {
  let initialProps: Parameters<typeof useShowDoorInfo>[0]
  let mockRecoveryMap: IRecoveryMap

  beforeEach(() => {
    initialProps = RUN_STATUS_AWAITING_RECOVERY
    mockRecoveryMap = {
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    } as IRecoveryMap
  })

  it('should return false values initially', () => {
    const { result } = renderHook(() =>
      useShowDoorInfo(initialProps, mockRecoveryMap)
    )
    expect(result.current).toEqual({
      isDoorOpen: false,
      isProhibitedDoorOpen: false,
    })
  })

  it(`should return true values when runStatus is ${RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR}`, () => {
    const props = RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR

    const { result } = renderHook(() => useShowDoorInfo(props, mockRecoveryMap))
    expect(result.current).toEqual({
      isDoorOpen: true,
      isProhibitedDoorOpen: true,
    })
  })

  it(`should return true values when runStatus is ${RUN_STATUS_AWAITING_RECOVERY_PAUSED}`, () => {
    const props = RUN_STATUS_AWAITING_RECOVERY_PAUSED

    const { result } = renderHook(() => useShowDoorInfo(props, mockRecoveryMap))
    expect(result.current).toEqual({
      isDoorOpen: true,
      isProhibitedDoorOpen: true,
    })
  })

  it(`should keep returning true values when runStatus changes from ${RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR} to ${RUN_STATUS_AWAITING_RECOVERY_PAUSED}`, () => {
    const { result, rerender } = renderHook(
      ({ runStatus, recoveryMap }) => useShowDoorInfo(runStatus, recoveryMap),
      {
        initialProps: { runStatus: initialProps, recoveryMap: mockRecoveryMap },
      }
    )

    act(() => {
      rerender({
        runStatus: RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
        recoveryMap: mockRecoveryMap,
      })
    })
    expect(result.current).toEqual({
      isDoorOpen: true,
      isProhibitedDoorOpen: true,
    })

    act(() => {
      rerender({
        runStatus: RUN_STATUS_AWAITING_RECOVERY_PAUSED,
        recoveryMap: mockRecoveryMap,
      })
    })
    expect(result.current).toEqual({
      isDoorOpen: true,
      isProhibitedDoorOpen: true,
    })
  })

  it('should return false values when runStatus changes to a non-door open status', () => {
    const { result, rerender } = renderHook(
      ({ runStatus, recoveryMap }) => useShowDoorInfo(runStatus, recoveryMap),
      {
        initialProps: {
          runStatus: RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
          recoveryMap: mockRecoveryMap,
        },
      }
    )

    expect(result.current).toEqual({
      isDoorOpen: true,
      isProhibitedDoorOpen: true,
    })

    act(() => {
      rerender({
        runStatus: RUN_STATUS_AWAITING_RECOVERY as any,
        recoveryMap: mockRecoveryMap,
      })
    })
    expect(result.current).toEqual({
      isDoorOpen: false,
      isProhibitedDoorOpen: false,
    })
  })

  it('should return false for prohibited door if the route is special-cased even if the door is open', () => {
    const props = RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR

    const { result } = renderHook(() =>
      useShowDoorInfo(props, {
        route: RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE,
        step: RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.STEPS.MANUALLY_FILL,
      })
    )

    expect(result.current.isProhibitedDoorOpen).toEqual(false)
  })
})
