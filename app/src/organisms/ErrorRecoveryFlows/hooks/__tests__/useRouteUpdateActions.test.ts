import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

import {
  useRouteUpdateActions,
  getRecoveryRouteNavigation,
} from '../useRouteUpdateActions'
import { INVALID, RECOVERY_MAP } from '../../constants'

import type { Mock } from 'vitest'
import type { GetRouteUpdateActionsParams } from '../useRouteUpdateActions'

describe('useRouteUpdateActions', () => {
  const { OPTION_SELECTION } = RECOVERY_MAP

  let useRouteUpdateActionsParams: GetRouteUpdateActionsParams
  let mockSetRecoveryMap: Mock
  let mockToggleERWizard: Mock

  beforeEach(() => {
    mockSetRecoveryMap = vi.fn()
    mockToggleERWizard = vi.fn()

    useRouteUpdateActionsParams = {
      hasLaunchedRecovery: true,
      toggleERWizAsActiveUser: mockToggleERWizard,
      recoveryMap: {
        route: RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE,
        step: RECOVERY_MAP.RETRY_FAILED_COMMAND.STEPS.CONFIRM_RETRY,
      },
      setRecoveryMap: mockSetRecoveryMap,
      doorStatusUtils: { isProhibitedDoorOpen: false, isDoorOpen: false },
    }
  })

  it(`routes to ${OPTION_SELECTION.ROUTE} ${OPTION_SELECTION.STEPS.SELECT} if proceedNextStep is called and the next step does not exist`, () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { proceedNextStep } = result.current

    void proceedNextStep()
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: OPTION_SELECTION.ROUTE,
      step: OPTION_SELECTION.STEPS.SELECT,
    })
    expect(mockToggleERWizard).not.toHaveBeenCalled()
  })

  it('toggles off the ER Wizard if proceedNextStep is called and hasLaunchedRecovery is false', () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions({
        ...useRouteUpdateActionsParams,
        hasLaunchedRecovery: false,
      })
    )

    const { proceedNextStep } = result.current

    void proceedNextStep()

    expect(mockToggleERWizard).toHaveBeenCalled()
  })

  it(`routes to ${OPTION_SELECTION.ROUTE} ${OPTION_SELECTION.STEPS.SELECT} if proceedPrevStep is called and the previous step does not exist`, () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { goBackPrevStep } = result.current

    void goBackPrevStep()
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: OPTION_SELECTION.ROUTE,
      step: OPTION_SELECTION.STEPS.SELECT,
    })
    expect(mockToggleERWizard).not.toHaveBeenCalled()
  })

  it('toggles off the ER Wizard if proceedPrevStep is called and hasLaunchedRecovery is false', () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions({
        ...useRouteUpdateActionsParams,
        hasLaunchedRecovery: false,
      })
    )

    const { goBackPrevStep } = result.current

    void goBackPrevStep()

    expect(mockToggleERWizard).toHaveBeenCalled()
  })

  it('routes to the first step of the supplied route when proceedToRoute is called', () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { proceedToRouteAndStep } = result.current

    void proceedToRouteAndStep(RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE)
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
      step: RECOVERY_MAP.ROBOT_IN_MOTION.STEPS.IN_MOTION,
    })
  })

  it('routes to "robot in motion" when no other motion path is specified', async () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { handleMotionRouting } = result.current

    await handleMotionRouting(true)
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
      step: RECOVERY_MAP.ROBOT_IN_MOTION.STEPS.IN_MOTION,
    })
  })

  it('rejects before routing to an "in motion" route if the door is open', async () => {
    const params = {
      ...useRouteUpdateActionsParams,
      doorStatusUtils: { isDoorOpen: true, isProhibitedDoorOpen: false },
    }

    const { result } = renderHook(() => useRouteUpdateActions(params))
    const { handleMotionRouting } = result.current

    await expect(handleMotionRouting(true)).rejects.toThrow()

    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_DOOR_OPEN.ROUTE,
      step: RECOVERY_MAP.ROBOT_DOOR_OPEN.STEPS.DOOR_OPEN,
    })
  })

  it('routes to alternative motion routes if specified', async () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { handleMotionRouting } = result.current

    await handleMotionRouting(true, RECOVERY_MAP.ROBOT_RESUMING.ROUTE)
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_RESUMING.ROUTE,
      step: RECOVERY_MAP.ROBOT_RESUMING.STEPS.RESUMING,
    })
  })

  it('routes to the route prior to motion after the motion completes', async () => {
    const { result, rerender } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { handleMotionRouting } = result.current

    await handleMotionRouting(true)
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
      step: RECOVERY_MAP.ROBOT_IN_MOTION.STEPS.IN_MOTION,
    })

    void handleMotionRouting(false)
    rerender()
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE,
      step: RECOVERY_MAP.RETRY_FAILED_COMMAND.STEPS.CONFIRM_RETRY,
    })
  })

  it('routes to the first step of the supplied route when proceedToRouteAndStep is called without a step', () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { proceedToRouteAndStep } = result.current

    void proceedToRouteAndStep(RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE)
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
      step: RECOVERY_MAP.ROBOT_IN_MOTION.STEPS.IN_MOTION,
    })
  })

  it('routes to the specified step of the supplied route when proceedToRouteAndStep is called with a valid step', () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { proceedToRouteAndStep } = result.current

    void proceedToRouteAndStep(
      RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE,
      RECOVERY_MAP.RETRY_FAILED_COMMAND.STEPS.CONFIRM_RETRY
    )
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE,
      step: RECOVERY_MAP.RETRY_FAILED_COMMAND.STEPS.CONFIRM_RETRY,
    })
  })

  it('routes to the first step of the supplied route when proceedToRouteAndStep is called with an invalid step', () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { proceedToRouteAndStep } = result.current

    void proceedToRouteAndStep(
      RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
      'invalid-step' as any
    )
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
      step: RECOVERY_MAP.ROBOT_IN_MOTION.STEPS.IN_MOTION,
    })
  })
})

describe('getRecoveryRouteNavigation', () => {
  it(`getNextStep and getPrevStep return ${INVALID} if the recovery route does not contain multiple steps`, () => {
    const { ROBOT_IN_MOTION } = RECOVERY_MAP
    const { getNextStep, getPrevStep } = getRecoveryRouteNavigation(
      ROBOT_IN_MOTION.ROUTE
    )
    const nextStepResult = getNextStep(ROBOT_IN_MOTION.STEPS.IN_MOTION)
    const prevStepResult = getPrevStep(ROBOT_IN_MOTION.STEPS.IN_MOTION)

    expect(nextStepResult).toEqual(INVALID)
    expect(prevStepResult).toEqual(INVALID)
  })
})
