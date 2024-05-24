import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

import { ERROR_KINDS, INVALID, RECOVERY_MAP } from '../constants'
import {
  getErrorKind,
  getRecoveryRouteNavigation,
  useRouteUpdateActions,
  useCurrentlyRecoveringFrom,
} from '../utils'
import { useNotifyAllCommandsQuery } from '../../../resources/runs'

import type { Mock } from 'vitest'
import type { GetRouteUpdateActionsParams } from '../utils'
import { useCommandQuery } from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client')
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
      route: RECOVERY_MAP.RESUME.ROUTE,
      step: RECOVERY_MAP.RESUME.STEPS.CONFIRM_RESUME,
    })
  })
})

const MOCK_RUN_ID = 'runId'
const MOCK_COMMAND_ID = 'commandId'

describe('useCurrentlyRecoveringFrom', () => {
  it('returns null if there is no currentlyRecoveringFrom command', () => {
    vi.mocked(useNotifyAllCommandsQuery).mockReturnValue({
      data: {
        links: {},
      },
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({} as any)

    const { result } = renderHook(() => useCurrentlyRecoveringFrom(MOCK_RUN_ID))

    expect(vi.mocked(useCommandQuery)).toHaveBeenCalledWith(null, null, {
      enabled: false,
    })
    expect(result.current).toStrictEqual(null)
  })

  it('fetches and returns the currentlyRecoveringFrom command, given that there is one', () => {
    vi.mocked(useNotifyAllCommandsQuery).mockReturnValue({
      data: {
        links: {
          currentlyRecoveringFrom: {
            meta: {
              runId: MOCK_RUN_ID,
              commandId: MOCK_COMMAND_ID,
            },
          },
        },
      },
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: 'mockCommandDetails' },
    } as any)

    const { result } = renderHook(() => useCurrentlyRecoveringFrom(MOCK_RUN_ID))

    expect(vi.mocked(useCommandQuery)).toHaveBeenCalledWith(
      MOCK_RUN_ID,
      MOCK_COMMAND_ID,
      { enabled: true }
    )
    expect(result.current).toStrictEqual('mockCommandDetails')
  })
})
