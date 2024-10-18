import { describe, it, vi, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import {
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY,
} from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { RecoveryDoorOpenSpecial } from '../RecoveryDoorOpenSpecial'
import { RECOVERY_MAP } from '../../constants'

import type * as React from 'react'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

describe('RecoveryDoorOpenSpecial', () => {
  let props: React.ComponentProps<typeof RecoveryDoorOpenSpecial>

  beforeEach(() => {
    props = {
      currentRecoveryOptionUtils: {
        selectedRecoveryOption: RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE,
      },
      runStatus: RUN_STATUS_AWAITING_RECOVERY,
      recoveryActionMutationUtils: {
        resumeRecovery: vi.fn(),
      },
      routeUpdateActions: {
        proceedToRouteAndStep: vi.fn(),
      },
      doorStatusUtils: {
        isDoorOpen: true,
      },
    } as any
  })

  const render = (
    props: React.ComponentProps<typeof RecoveryDoorOpenSpecial>
  ) => {
    return renderWithProviders(<RecoveryDoorOpenSpecial {...props} />, {
      i18nInstance: i18n,
    })[0]
  }

  it('calls resumeRecovery when primary button is clicked', async () => {
    render(props)

    clickButtonLabeled('Continue')

    expect(props.recoveryActionMutationUtils.resumeRecovery).toHaveBeenCalled()
  })

  it(`disables primary button when runStatus is ${RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR}`, () => {
    props.runStatus = RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR
    render(props)

    const btn = screen.getAllByRole('button', { name: 'Continue' })[0]

    expect(btn).toBeDisabled()
  })

  it(`renders correct copy for ${RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE}`, () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE
    render(props)
    screen.getByText('Close the robot door')
    screen.getByText(
      'The robot door must be closed for the gripper to home its Z-axis before you can continue manually moving labware.'
    )
  })

  it('renders default subtext for unhandled recovery option', () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption = 'UNHANDLED_OPTION' as any
    render(props)
    screen.getByText('Close the robot door')
    screen.getByText(
      'Close the robot door, and then resume the recovery action.'
    )
  })

  it(`calls proceedToRouteAndStep when door is closed for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE}`, () => {
    props.doorStatusUtils.isDoorOpen = false
    render(props)
    expect(props.routeUpdateActions.proceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE,
      RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE
    )
  })

  it(`calls proceedToRouteAndStep when door is closed for ${RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE}`, () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption =
      RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE
    props.doorStatusUtils.isDoorOpen = false
    render(props)
    expect(props.routeUpdateActions.proceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
      RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.STEPS.MANUAL_MOVE
    )
  })

  it('calls proceedToRouteAndStep with OPTION_SELECTION for unhandled recovery option when door is closed', () => {
    props.currentRecoveryOptionUtils.selectedRecoveryOption = 'UNHANDLED_OPTION' as any
    props.doorStatusUtils.isDoorOpen = false
    render(props)
    expect(props.routeUpdateActions.proceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.OPTION_SELECTION.ROUTE
    )
  })
})
