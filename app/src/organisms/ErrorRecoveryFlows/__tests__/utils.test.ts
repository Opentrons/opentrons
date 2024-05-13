import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_RUNNING,
} from '@opentrons/api-client'

import { ERROR_KINDS, INVALID, RECOVERY_MAP } from '../constants'
import {
  getErrorKind,
  getRecoveryRouteNavigation,
  useRouteUpdateActions,
  useCurrentlyFailedRunCommand,
} from '../utils'
import { useNotifyAllCommandsQuery } from '../../../resources/runs'

import type { Mock } from 'vitest'
import type { GetRouteUpdateActionsParams } from '../utils'

vi.mock('../../../resources/runs')

describe('getErrorKind', () => {
  it(`returns ${ERROR_KINDS.GENERAL_ERROR} if the errorType isn't handled explicitly`, () => {
    const mockErrorType = 'NON_HANDLED_ERROR'
    const result = getErrorKind(mockErrorType)
    expect(result).toEqual(ERROR_KINDS.GENERAL_ERROR)
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

describe('useRouteUpdateActions', () => {
  const { OPTION_SELECTION } = RECOVERY_MAP

  let useRouteUpdateActionsParams: GetRouteUpdateActionsParams
  let mockSetRecoveryMap: Mock

  beforeEach(() => {
    mockSetRecoveryMap = vi.fn()

    useRouteUpdateActionsParams = {
      recoveryMap: {
        route: RECOVERY_MAP.RESUME.ROUTE,
        step: RECOVERY_MAP.RESUME.STEPS.CONFIRM_RESUME,
      },
      setRecoveryMap: mockSetRecoveryMap,
    }
  })

  it(`routes to ${OPTION_SELECTION.ROUTE} ${OPTION_SELECTION.STEPS.SELECT} if proceedNextStep is called and the next step does not exist`, () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { proceedNextStep } = result.current

    proceedNextStep()
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: OPTION_SELECTION.ROUTE,
      step: OPTION_SELECTION.STEPS.SELECT,
    })
  })

  it(`routes to ${OPTION_SELECTION.ROUTE} ${OPTION_SELECTION.STEPS.SELECT} if proceedPrevStep is called and the previous step does not exist`, () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { goBackPrevStep } = result.current

    goBackPrevStep()
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: OPTION_SELECTION.ROUTE,
      step: OPTION_SELECTION.STEPS.SELECT,
    })
  })

  it('routes to the first step of the supplied route when proceedToRoute is called', () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { proceedToRoute } = result.current

    proceedToRoute(RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE)
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
      step: RECOVERY_MAP.ROBOT_IN_MOTION.STEPS.IN_MOTION,
    })
  })

  it('routes to "robot in motion" when no other motion path is specified', () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { setRobotInMotion } = result.current

    setRobotInMotion(true)
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
      step: RECOVERY_MAP.ROBOT_IN_MOTION.STEPS.IN_MOTION,
    })
  })

  it('routes to alternative motion routes if specified', () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { setRobotInMotion } = result.current

    setRobotInMotion(true, RECOVERY_MAP.ROBOT_RESUMING.ROUTE)
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_RESUMING.ROUTE,
      step: RECOVERY_MAP.ROBOT_RESUMING.STEPS.RESUMING,
    })
  })

  it('routes to the route prior to motion after the motion completes', () => {
    const { result } = renderHook(() =>
      useRouteUpdateActions(useRouteUpdateActionsParams)
    )
    const { setRobotInMotion } = result.current

    setRobotInMotion(true)
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
      step: RECOVERY_MAP.ROBOT_IN_MOTION.STEPS.IN_MOTION,
    })

    setRobotInMotion(false)
    expect(mockSetRecoveryMap).toHaveBeenCalledWith({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  })
})

const MOCK_COMMANDS_QUERY = {
  data: {
    data: [
      { status: 'failed', intent: 'fixit', id: '0' },
      { status: 'failed', intent: 'protocol', id: '111' },
      { status: 'failed', intent: 'protocol', id: '123' },
      { status: 'success', intent: 'fixit', id: '1' },
    ],
  },
} as any

const MOCK_RUN_ID = 'runId'

describe('useCurrentlyFailedRunCommand', () => {
  beforeEach(() => {
    vi.mocked(useNotifyAllCommandsQuery).mockReturnValue(MOCK_COMMANDS_QUERY)
  })

  it('returns null on initial render when the run status is not "awaiting-recovery"', () => {
    const { result } = renderHook(() =>
      useCurrentlyFailedRunCommand(MOCK_RUN_ID, RUN_STATUS_RUNNING)
    )

    expect(result.current).toBeNull()
  })

  it('sets recentFailedCommand correctly when runStatus is "awaiting-recovery" and there is no recent failed command', () => {
    const { result, rerender } = renderHook(
      // @ts-expect-error this works
      props => useCurrentlyFailedRunCommand(...props),
      {
        initialProps: [MOCK_RUN_ID, RUN_STATUS_RUNNING],
      }
    )

    act(() => {
      rerender([MOCK_RUN_ID, RUN_STATUS_AWAITING_RECOVERY])
    })

    expect(result.current).toEqual({
      status: 'failed',
      intent: 'protocol',
      id: '123',
    })
  })

  it('always returns the  failed protocol run command that caused the run to enter "awaiting-recovery"', () => {
    const { result, rerender } = renderHook(
      // @ts-expect-error this works
      props => useCurrentlyFailedRunCommand(...props),
      {
        initialProps: [MOCK_RUN_ID, RUN_STATUS_AWAITING_RECOVERY],
      }
    )

    vi.mocked(useNotifyAllCommandsQuery).mockReturnValue({
      ...MOCK_COMMANDS_QUERY,
      ...{ status: 'failed', intent: 'protocol', id: '124' },
    })
    rerender([MOCK_RUN_ID, RUN_STATUS_AWAITING_RECOVERY])

    expect(result.current).toEqual({
      status: 'failed',
      intent: 'protocol',
      id: '123',
    })
  })

  it('sets recentFailedCommand to null when runStatus is not "awaiting-recovery"', () => {
    const { result, rerender } = renderHook(
      // @ts-expect-error this works
      props => useCurrentlyFailedRunCommand(...props),
      {
        initialProps: ['runId', 'awaiting-recovery'],
      }
    )

    act(() => {
      rerender([MOCK_RUN_ID, RUN_STATUS_RUNNING])
    })

    expect(result.current).toBeNull()
  })
})
