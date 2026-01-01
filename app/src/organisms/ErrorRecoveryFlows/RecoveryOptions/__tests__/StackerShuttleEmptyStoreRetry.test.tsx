import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import {
  RetryStepInfo,
  StackerHomeShuttle,
  StackerHopperLwInfo,
  StackerShuttleLwInfo,
} from '../../shared'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { StackerShuttleEmptyStoreRetry } from '../StackerShuttleEmptyRetryStore'

import type { ComponentProps } from 'react'

vi.mock('../SelectRecoveryOption')
vi.mock('../../shared/')

const render = (
  props: ComponentProps<typeof StackerShuttleEmptyStoreRetry>
) => {
  return renderWithProviders(<StackerShuttleEmptyStoreRetry {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StackerShuttleEmptyStoreRetry', () => {
  let props: ComponentProps<typeof StackerShuttleEmptyStoreRetry>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      currentRecoveryOptionUtils: {
        ...mockRecoveryContentProps.currentRecoveryOptionUtils,
        selectedRecoveryOption: RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE,
      },
    }
    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
    vi.mocked(StackerHopperLwInfo).mockReturnValue(
      <div>MOCK_STACKER_HOPPER_LW_INFO</div>
    )
    vi.mocked(RetryStepInfo).mockReturnValue(<div>MOCK_RETRY_STEP_INFO</div>)
    vi.mocked(StackerShuttleLwInfo).mockReturnValue(
      <div>MOCK_SHUTTLE_LABWARE_INFO</div>
    )
    vi.mocked(StackerHomeShuttle).mockReturnValue(<div>MOCK_HOME_SHUTTLE</div>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`renders StackerHopperLwInfo when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.CHECK_HOPPER}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.CHECK_HOPPER
    render(props)
    screen.getByText('MOCK_STACKER_HOPPER_LW_INFO')
  })

  it(`renders twoColumnAndImage when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.PLACE_LABWARE_ON_SHUTTLE}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.PLACE_LABWARE_ON_SHUTTLE
    render(props)
    screen.getByText('MOCK_SHUTTLE_LABWARE_INFO')
  })

  it(`renders RetryStepInfo when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.RETRY}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.RETRY
    render(props)
    screen.getByText('MOCK_RETRY_STEP_INFO')
  })

  it(`renders SelectRecoveryOption for unknown step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })

  it(`renders StackerHomeShuttle when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS
    render(props)
    screen.getByText('MOCK_HOME_SHUTTLE')
  })
})
