import type * as React from 'react'
import { beforeEach, describe, it, vi, afterEach, expect } from 'vitest'
import { act, renderHook, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockRecoveryContentProps } from '../__fixtures__'
import {
  RecoveryInProgress,
  useGripperRelease,
  GRIPPER_RELEASE_COUNTDOWN_S,
} from '../RecoveryInProgress'
import { RECOVERY_MAP } from '../constants'

const render = (props: React.ComponentProps<typeof RecoveryInProgress>) => {
  return renderWithProviders(<RecoveryInProgress {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecoveryInProgress', () => {
  const {
    ROBOT_CANCELING,
    ROBOT_IN_MOTION,
    ROBOT_RESUMING,
    ROBOT_RETRYING_STEP,
    ROBOT_PICKING_UP_TIPS,
    ROBOT_SKIPPING_STEP,
    ROBOT_RELEASING_LABWARE,
  } = RECOVERY_MAP
  let props: React.ComponentProps<typeof RecoveryInProgress>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      recoveryMap: {
        route: ROBOT_IN_MOTION.ROUTE,
        step: ROBOT_IN_MOTION.STEPS.IN_MOTION,
      },
      recoveryCommands: {
        releaseGripperJaws: vi.fn(() => Promise.resolve()),
      } as any,
      routeUpdateActions: {
        handleMotionRouting: vi.fn(() => Promise.resolve()),
        proceedNextStep: vi.fn(() => Promise.resolve()),
      } as any,
    }
  })

  it(`renders appropriate copy when the route is ${ROBOT_IN_MOTION.ROUTE}`, () => {
    render(props)

    screen.getByText('Stand back, robot is in motion')
  })

  it(`renders appropriate copy when the route is ${ROBOT_RESUMING.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_RESUMING.ROUTE,
        step: ROBOT_RESUMING.STEPS.RESUMING,
      },
    }
    render(props)

    screen.getByText('Stand back, resuming current step')
  })

  it(`renders appropriate copy when the route is ${ROBOT_RETRYING_STEP.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_RETRYING_STEP.ROUTE,
        step: ROBOT_RETRYING_STEP.STEPS.RETRYING,
      },
    }
    render(props)

    screen.getByText('Stand back, retrying failed step')
  })

  it(`renders appropriate copy when the route is ${ROBOT_CANCELING.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_CANCELING.ROUTE,
        step: ROBOT_CANCELING.STEPS.CANCELING,
      },
    }
    render(props)

    screen.getByText('Canceling run')
  })

  it(`renders appropriate copy when the route is ${ROBOT_PICKING_UP_TIPS.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_PICKING_UP_TIPS.ROUTE,
        step: ROBOT_PICKING_UP_TIPS.STEPS.PICKING_UP_TIPS,
      },
    }
    render(props)

    screen.getByText('Stand back, picking up tips')
  })

  it(`renders appropriate copy when the route is ${ROBOT_SKIPPING_STEP.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_SKIPPING_STEP.ROUTE,
        step: ROBOT_SKIPPING_STEP.STEPS.SKIPPING,
      },
    }
    render(props)

    screen.getByText('Stand back, skipping to next step')
  })

  it(`renders appropriate copy when the route is ${ROBOT_RELEASING_LABWARE.ROUTE}`, () => {
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_RELEASING_LABWARE.ROUTE,
        step: ROBOT_RELEASING_LABWARE.STEPS.RELEASING_LABWARE,
      },
    }
    render(props)

    screen.getByText('Gripper will release labware in 3 seconds')
  })

  it('updates countdown for gripper release', () => {
    vi.useFakeTimers()
    props = {
      ...props,
      recoveryMap: {
        route: ROBOT_RELEASING_LABWARE.ROUTE,
        step: ROBOT_RELEASING_LABWARE.STEPS.RELEASING_LABWARE,
      },
    }
    render(props)

    screen.getByText('Gripper will release labware in 3 seconds')

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    screen.getByText('Gripper will release labware in 2 seconds')

    act(() => {
      vi.advanceTimersByTime(GRIPPER_RELEASE_COUNTDOWN_S * 1000 - 1000)
    })

    screen.getByText('Gripper releasing labware')
  })
})

describe('useGripperRelease', () => {
  const mockProps = {
    recoveryMap: {
      route: RECOVERY_MAP.ROBOT_RELEASING_LABWARE.ROUTE,
      step: RECOVERY_MAP.ROBOT_RELEASING_LABWARE.STEPS.RELEASING_LABWARE,
    },
    recoveryCommands: {
      releaseGripperJaws: vi.fn().mockResolvedValue(undefined),
    },
    routeUpdateActions: {
      proceedToRouteAndStep: vi.fn(),
      proceedNextStep: vi.fn(),
      handleMotionRouting: vi.fn(),
      stashedMap: {
        route: RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
      },
    },
    currentRecoveryOptionUtils: {
      selectedRecoveryOption: RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
    },
    doorStatusUtils: { isDoorOpen: false },
  } as any

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down from 3 seconds', () => {
    const { result } = renderHook(() => useGripperRelease(mockProps))

    expect(result.current).toBe(3)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current).toBe(2)

    act(() => {
      vi.advanceTimersByTime(GRIPPER_RELEASE_COUNTDOWN_S * 1000 - 1000)
    })

    expect(result.current).toBe(0)
  })

  const IS_DOOR_OPEN = [false, true]

  IS_DOOR_OPEN.forEach(doorStatus => {
    it(`releases gripper jaws and proceeds to next step after countdown for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE} when the isDoorOpen is ${doorStatus}`, async () => {
      renderHook(() =>
        useGripperRelease({
          ...mockProps,
          doorStatusUtils: { isDoorOpen: doorStatus },
        })
      )

      act(() => {
        vi.advanceTimersByTime(GRIPPER_RELEASE_COUNTDOWN_S * 1000)
      })

      await vi.runAllTimersAsync()

      expect(mockProps.recoveryCommands.releaseGripperJaws).toHaveBeenCalled()
      expect(
        mockProps.routeUpdateActions.handleMotionRouting
      ).toHaveBeenCalledWith(false)
      if (!doorStatus) {
        expect(
          mockProps.routeUpdateActions.proceedToRouteAndStep
        ).toHaveBeenCalledWith(
          RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
          RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.STEPS.MANUAL_MOVE
        )
      } else {
        expect(
          mockProps.routeUpdateActions.proceedToRouteAndStep
        ).toHaveBeenCalledWith(
          RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
          RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME
        )
      }
    })
  })

  IS_DOOR_OPEN.forEach(doorStatus => {
    it(`releases gripper jaws and proceeds to next step after countdown for ${RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE} when the isDoorOpen is ${doorStatus}`, async () => {
      const modifiedProps = {
        ...mockProps,
        routeUpdateActions: {
          ...mockProps.routeUpdateActions,
          stashedMap: {
            route: RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
          },
        },
        currentRecoveryOptionUtils: {
          selectedRecoveryOption: RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
        },
      }

      renderHook(() =>
        useGripperRelease({
          ...modifiedProps,
          doorStatusUtils: { isDoorOpen: doorStatus },
        })
      )

      act(() => {
        vi.advanceTimersByTime(GRIPPER_RELEASE_COUNTDOWN_S * 1000)
      })

      await vi.runAllTimersAsync()

      expect(mockProps.recoveryCommands.releaseGripperJaws).toHaveBeenCalled()
      expect(
        mockProps.routeUpdateActions.handleMotionRouting
      ).toHaveBeenCalledWith(false)
      if (!doorStatus) {
        expect(
          mockProps.routeUpdateActions.proceedToRouteAndStep
        ).toHaveBeenCalledWith(
          RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
          RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.STEPS.MANUAL_MOVE
        )
      } else {
        expect(
          mockProps.routeUpdateActions.proceedToRouteAndStep
        ).toHaveBeenCalledWith(
          RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
          RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME
        )
      }
    })
  })

  it('calls proceedNextStep for unhandled routes', async () => {
    const modifiedProps = {
      ...mockProps,
      routeUpdateActions: {
        ...mockProps.routeUpdateActions,
        stashedMap: {
          route: 'UNHANDLED_ROUTE',
        },
      },
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RECOVERY_MAP.MANUAL_FILL_AND_SKIP.ROUTE,
      },
      doorStatusUtils: { isDoorOpen: false },
    }

    renderHook(() => useGripperRelease(modifiedProps))

    act(() => {
      vi.advanceTimersByTime(GRIPPER_RELEASE_COUNTDOWN_S * 1000)
    })

    await vi.runAllTimersAsync()

    expect(modifiedProps.routeUpdateActions.proceedNextStep).toHaveBeenCalled()
  })
})
