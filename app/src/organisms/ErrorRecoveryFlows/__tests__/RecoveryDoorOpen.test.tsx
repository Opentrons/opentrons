import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RUN_STATUS_AWAITING_RECOVERY_PAUSED } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../__fixtures__'
import { RECOVERY_MAP } from '../constants'
import { RecoveryDoorOpen } from '../RecoveryDoorOpen'
import { clickButtonLabeled } from './util'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof RecoveryDoorOpen>) => {
  return renderWithProviders(<RecoveryDoorOpen {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecoveryDoorOpen', () => {
  let props: ComponentProps<typeof RecoveryDoorOpen>
  let mockResumeRecovery: Mock
  let mockProceedToRouteAndStep: Mock

  beforeEach(() => {
    mockResumeRecovery = vi.fn().mockResolvedValue(undefined)
    mockProceedToRouteAndStep = vi.fn()
    props = {
      ...mockRecoveryContentProps,
      recoveryActionMutationUtils: {
        resumeRecovery: mockResumeRecovery,
        isResumeRecoveryLoading: false,
      },
      runStatus: RUN_STATUS_AWAITING_RECOVERY_PAUSED,
      routeUpdateActions: {
        stashedMap: null,
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any,
    }
  })

  it(`calls resumeRecovery when the primary button is clicked and the run status is ${RUN_STATUS_AWAITING_RECOVERY_PAUSED}`, () => {
    render(props)

    clickButtonLabeled('Resume')

    expect(mockResumeRecovery).toHaveBeenCalledTimes(1)
  })

  it('calls proceedToRouteAndStep after resumeRecovery if stashedMap is provided', async () => {
    const stashedMap = { route: 'testRoute', step: 'testStep' } as any
    props.routeUpdateActions.stashedMap = stashedMap

    render(props)

    clickButtonLabeled('Resume')

    await vi.waitFor(() => {
      expect(mockResumeRecovery).toHaveBeenCalledTimes(1)
      expect(mockProceedToRouteAndStep).toHaveBeenCalledTimes(1)
      expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
        stashedMap.route,
        stashedMap.step
      )
    })
  })
  // Routes that should return stacker text.
  const STACKER_ROUTES = [
    RECOVERY_MAP.HOPPER_MANUAL_LOAD_AND_RETRY.ROUTE,
    RECOVERY_MAP.HOPPER_MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.ROUTE,
    RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.ROUTE,
    RECOVERY_MAP.MANUAL_REPLACE_STACKER_AND_RETRY.ROUTE,
    RECOVERY_MAP.MANUAL_LOAD_IN_STACKER_AND_SKIP.ROUTE,
    RECOVERY_MAP.MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.ROUTE,
    RECOVERY_MAP.REPLACE_LABWARE_IN_HOPPER_AND_RETRY.ROUTE,
    RECOVERY_MAP.ROBOT_RELEASING_LABWARE_LATCH.ROUTE,
  ]

  // Routes that should return the door open text.
  const NONE_STACKER_ROUTES = [
    RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE,
    RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE,
    RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE,
    RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
    RECOVERY_MAP.CANCEL_RUN.ROUTE,
    RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE,
    RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
    RECOVERY_MAP.RETRY_STEP.ROUTE,
    RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE,
    RECOVERY_MAP.HOME_AND_RETRY.ROUTE,
    RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
    RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
    RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE,
    RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE,
    RECOVERY_MAP.ROBOT_CANCELING.ROUTE,
    RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE,
    RECOVERY_MAP.ROBOT_PICKING_UP_TIPS.ROUTE,
    RECOVERY_MAP.ROBOT_RELEASING_LABWARE.ROUTE,
    RECOVERY_MAP.ROBOT_RESUMING.ROUTE,
    RECOVERY_MAP.ROBOT_RETRYING_STEP.ROUTE,
    RECOVERY_MAP.ROBOT_SKIPPING_STEP.ROUTE,
    RECOVERY_MAP.ROBOT_DOOR_OPEN.ROUTE,
    RECOVERY_MAP.ROBOT_DOOR_OPEN_SPECIAL.ROUTE,
    RECOVERY_MAP.OPTION_SELECTION.ROUTE,
  ]

  it.each(STACKER_ROUTES)(
    'renderes correct content for stacker route %s',
    route => {
      props.currentRecoveryOptionUtils.selectedRecoveryOption = route
      render(props)

      screen.getByTestId('recovery_door_alert_icon')
      screen.getByText('Close the robot and stacker door')
      screen.getByText(
        'The robot needs to safely move to its home location before you manually move the labware.'
      )
    }
  )

  it.each(NONE_STACKER_ROUTES)(
    'renderes correct content for route %s',
    route => {
      props.currentRecoveryOptionUtils.selectedRecoveryOption = route
      render(props)

      screen.getByTestId('recovery_door_alert_icon')
      screen.getByText('Robot door is open')
      screen.getByText(
        'Close the robot door, and then resume the recovery action.'
      )
    }
  )
})
