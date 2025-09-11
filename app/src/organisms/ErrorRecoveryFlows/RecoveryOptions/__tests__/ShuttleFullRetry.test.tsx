import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import {
  RetryStepInfo,
  StackerEnsureShuttleEmpty,
  StackerHomeShuttle,
  StackerHopperLwInfo,
} from '../../shared'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { ShuttleFullRetry } from '../ShuttleFullRetry'

import type { ComponentProps } from 'react'

vi.mock('../SelectRecoveryOption')
vi.mock('../../shared/')

const render = (props: ComponentProps<typeof ShuttleFullRetry>) => {
  return renderWithProviders(<ShuttleFullRetry {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StackerStalledRetry', () => {
  let props: ComponentProps<typeof ShuttleFullRetry>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      currentRecoveryOptionUtils: {
        ...mockRecoveryContentProps.currentRecoveryOptionUtils,
        selectedRecoveryOption: RECOVERY_MAP.SHUTTLE_FULL_RETRY.ROUTE,
      },
    }
    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
    vi.mocked(StackerHomeShuttle).mockReturnValue(
      <div>MOCK_STACKER_HOME_SHUTTLE</div>
    )
    vi.mocked(StackerHopperLwInfo).mockReturnValue(
      <div>MOCK_STACKER_HOPPER_LW_INFO</div>
    )
    vi.mocked(RetryStepInfo).mockReturnValue(<div>MOCK_RETRY_STEP_INFO</div>)
    vi.mocked(StackerEnsureShuttleEmpty).mockReturnValue(
      <div>MOCK_TWO_COLUMN_AND_IMAGE</div>
    )
  })

  it(`renders StackerHomeShuttle when step is ${RECOVERY_MAP.SHUTTLE_FULL_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.SHUTTLE_FULL_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS
    render(props)
    screen.getByText('MOCK_STACKER_HOME_SHUTTLE')
  })

  it(`renders StackerHopperLwInfo when step is ${RECOVERY_MAP.SHUTTLE_FULL_RETRY.STEPS.CHECK_HOPPER}`, () => {
    props.recoveryMap.step = RECOVERY_MAP.SHUTTLE_FULL_RETRY.STEPS.CHECK_HOPPER
    render(props)
    screen.getByText('MOCK_STACKER_HOPPER_LW_INFO')
  })

  it(`renders twoColumnAndImage when step is ${RECOVERY_MAP.SHUTTLE_FULL_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.SHUTTLE_FULL_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY
    render(props)
    screen.getByText('MOCK_TWO_COLUMN_AND_IMAGE')
  })

  it(`renders RetryStepInfo when step is ${RECOVERY_MAP.SHUTTLE_FULL_RETRY.STEPS.RETRY}`, () => {
    props.recoveryMap.step = RECOVERY_MAP.SHUTTLE_FULL_RETRY.STEPS.RETRY
    render(props)
    screen.getByText('MOCK_RETRY_STEP_INFO')
  })

  it(`renders SelectRecoveryOption for unknown step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })
})
