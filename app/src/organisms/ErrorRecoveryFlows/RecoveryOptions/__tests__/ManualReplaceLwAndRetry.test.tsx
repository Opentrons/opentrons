import { act, fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { RECOVERY_MAP } from '../../constants'
import { ManualReplaceLwAndRetry } from '../ManualReplaceLwAndRetry'

import type { ComponentProps } from 'react'

vi.mock('../../shared', async importOriginal => {
  const mod = (await importOriginal()) as any
  return {
    ...mod,
    HoldingLabware: vi.fn(() => <div>MOCK_GRIPPER_IS_HOLDING_LABWARE</div>),
    ReleaseLabware: vi.fn(() => <div>MOCK_GRIPPER_RELEASE_LABWARE</div>),
    TwoColLwInfoAndDeck: vi.fn(() => <div>MOCK_TWO_COL_LW_INFO_AND_DECK</div>),
    RetryStepInfo: vi.fn(() => <div>MOCK_RETRY_STEP_INFO</div>),
    RecoveryDoorOpenSpecial: vi.fn(() => <div>MOCK_DOOR_OPEN_SPECIAL</div>),
  }
})

vi.mock('../SelectRecoveryOption', () => ({
  SelectRecoveryOption: vi.fn(() => <div>MOCK_SELECT_RECOVERY_OPTION</div>),
}))

describe('ManualReplaceLwAndRetry', () => {
  let props: ComponentProps<typeof ManualReplaceLwAndRetry>

  beforeEach(() => {
    props = {
      recoveryMap: {
        route: RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE,
        step:
          RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_HOLDING_LABWARE,
      },
      doorStatusUtils: {
        isDoorOpen: false,
      },
      routeUpdateActions: {
        proceedToRouteAndStep: vi.fn(),
        handleMotionRouting: vi.fn(() => Promise.resolve()),
      },
      recoveryCommands: {
        homeShuttle: vi.fn(() => Promise.resolve()),
      },
      stepCounts: {
        hasRunDiverged: false,
      },
    } as any
  })

  const render = (props: ComponentProps<typeof ManualReplaceLwAndRetry>) => {
    return renderWithProviders(<ManualReplaceLwAndRetry {...props} />, {
      i18nInstance: i18n,
    })[0]
  }

  it(`renders HoldingLabware for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_HOLDING_LABWARE}`, () => {
    render(props)
    screen.getByText('MOCK_GRIPPER_IS_HOLDING_LABWARE')
  })

  it(`renders ReleaseLabware for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_RELEASE_LABWARE} step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_RELEASE_LABWARE
    render(props)
    screen.getByText('MOCK_GRIPPER_RELEASE_LABWARE')
  })

  it(`renders RecoveryDoorOpenSpecial for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME} step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME
    render(props)
    screen.getByText('MOCK_DOOR_OPEN_SPECIAL')
  })

  it(`renders TwoColLwInfoAndDeck for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE} step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE
    render(props)
    screen.getByText('MOCK_TWO_COL_LW_INFO_AND_DECK')
  })

  it(`renders RetryStepInfo for ${RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.RETRY} step`, () => {
    props.recoveryMap.step = RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.STEPS.RETRY
    render(props)
    screen.getByText('MOCK_RETRY_STEP_INFO')
  })

  it(`renders TwoColLwInfoAndDeck for ${RECOVERY_MAP.MANUAL_REPLACE_STACKER_AND_RETRY.STEPS.CONFIRM_RETRY} step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.MANUAL_REPLACE_STACKER_AND_RETRY.STEPS.CONFIRM_RETRY
    render(props)
    screen.getByText('MOCK_TWO_COL_LW_INFO_AND_DECK')
  })

  it(`renders TwoColLwInfoAndDeck for ${RECOVERY_MAP.MANUAL_LOAD_IN_STACKER_AND_SKIP.STEPS.MANUAL_REPLACE} step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.MANUAL_LOAD_IN_STACKER_AND_SKIP.STEPS.MANUAL_REPLACE
    render(props)
    screen.getByText('MOCK_TWO_COL_LW_INFO_AND_DECK')
  })

  it(`renders TwoColTextAndImage for ${RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.STEPS.MANUAL_REPLACE} step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.STEPS.MANUAL_REPLACE
    props.recoveryMap.route = RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.ROUTE
    render(props)
    const button = screen.getAllByRole('button')[0]
    expect(button).toBeEnabled()
    screen.getByText('Load labware shuttle onto track')
  })

  it(`renders TwoColTextAndFailedStepNextStep for ${RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING} step`, async () => {
    props.recoveryMap.step =
      RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING

    props.recoveryMap.route = RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.ROUTE
    render(props)

    const button = screen.getAllByRole('button')[1]
    expect(button).toBeEnabled()
    fireEvent.click(button)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(props.routeUpdateActions.handleMotionRouting).toHaveBeenCalled()
    expect(props.recoveryCommands.homeShuttle).toHaveBeenCalled()
  })

  it('renders SelectRecoveryOption for unknown step', () => {
    props.recoveryMap.step =
      RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })
})
