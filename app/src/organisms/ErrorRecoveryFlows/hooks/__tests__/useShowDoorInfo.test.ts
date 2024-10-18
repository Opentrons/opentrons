import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
} from '@opentrons/api-client'

import { useShowDoorInfo } from '../useShowDoorInfo'
import {
  RECOVERY_MAP,
  GRIPPER_MOVE_STEPS,
} from '/app/organisms/ErrorRecoveryFlows/constants'

import type { IRecoveryMap, RouteStep } from '../../types'

describe('useShowDoorInfo', () => {
  let initialProps: Parameters<typeof useShowDoorInfo>[0]
  let mockRecoveryMap: IRecoveryMap
  let initialStep: RouteStep

  beforeEach(() => {
    initialProps = RUN_STATUS_AWAITING_RECOVERY
    mockRecoveryMap = {
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    } as IRecoveryMap
    initialStep = RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT
  })

  it('should return false values initially', () => {
    const { result } = renderHook(() =>
      useShowDoorInfo(initialProps, mockRecoveryMap, initialStep)
    )
    expect(result.current).toEqual({
      isDoorOpen: false,
      isProhibitedDoorOpen: false,
    })
  })

  it(`should return true values when runStatus is ${RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR}`, () => {
    const props = RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR

    const { result } = renderHook(() =>
      useShowDoorInfo(props, mockRecoveryMap, initialStep)
    )
    expect(result.current).toEqual({
      isDoorOpen: true,
      isProhibitedDoorOpen: true,
    })
  })

  it(`should return true values when runStatus is ${RUN_STATUS_AWAITING_RECOVERY_PAUSED}`, () => {
    const props = RUN_STATUS_AWAITING_RECOVERY_PAUSED

    const { result } = renderHook(() =>
      useShowDoorInfo(props, mockRecoveryMap, initialStep)
    )
    expect(result.current).toEqual({
      isDoorOpen: true,
      isProhibitedDoorOpen: true,
    })
  })

  it(`should keep returning true values when runStatus changes from ${RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR} to ${RUN_STATUS_AWAITING_RECOVERY_PAUSED}`, () => {
    const { result, rerender } = renderHook(
      ({ runStatus, recoveryMap, currentStep }) =>
        useShowDoorInfo(runStatus, recoveryMap, currentStep),
      {
        initialProps: {
          runStatus: initialProps,
          recoveryMap: mockRecoveryMap,
          currentStep: initialStep,
        },
      }
    )

    act(() => {
      rerender({
        runStatus: RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
        recoveryMap: mockRecoveryMap,
        currentStep: initialStep,
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
        currentStep: initialStep,
      })
    })
    expect(result.current).toEqual({
      isDoorOpen: true,
      isProhibitedDoorOpen: true,
    })
  })

  it('should return false values when runStatus changes to a non-door open status', () => {
    const { result, rerender } = renderHook(
      ({ runStatus, recoveryMap, currentStep }) =>
        useShowDoorInfo(runStatus, recoveryMap, currentStep),
      {
        initialProps: {
          runStatus: RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
          recoveryMap: mockRecoveryMap,
          currentStep: initialStep,
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
        currentStep: initialStep,
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
      useShowDoorInfo(
        props,
        {
          route: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.ROUTE,
          step: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.STEPS.MANUAL_FILL,
        },
        RECOVERY_MAP.MANUAL_FILL_AND_SKIP.STEPS.MANUAL_FILL
      )
    )

    expect(result.current.isProhibitedDoorOpen).toEqual(false)
  })

  it('should return false for prohibited door if the current step is in GRIPPER_MOVE_STEPS', () => {
    const props = RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR

    GRIPPER_MOVE_STEPS.forEach(step => {
      const { result } = renderHook(() =>
        useShowDoorInfo(props, mockRecoveryMap, step)
      )

      expect(result.current).toEqual({
        isDoorOpen: true,
        isProhibitedDoorOpen: false,
      })
    })
  })
})
