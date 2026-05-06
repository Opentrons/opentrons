import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import {
  RetryStepInfo,
  VacuumDisconnectEmptyCarboy,
  VacuumReconnectWasteTube,
} from '../../shared'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { VacuumCarboyFullRetry } from '../VacuumCarboyFullRetry'

import type { ComponentProps } from 'react'

vi.mock('../SelectRecoveryOption')
vi.mock('../../shared/')

const render = (props: ComponentProps<typeof VacuumCarboyFullRetry>) => {
  return renderWithProviders(<VacuumCarboyFullRetry {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('VacuumCarboyFullRetry', () => {
  let props: ComponentProps<typeof VacuumCarboyFullRetry>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      currentRecoveryOptionUtils: {
        ...mockRecoveryContentProps.currentRecoveryOptionUtils,
        selectedRecoveryOption: RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.ROUTE,
      },
    }
    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
    vi.mocked(VacuumDisconnectEmptyCarboy).mockReturnValue(
      <div>MOCK_VACUUM_DISCONNECT_EMPTY_CARBOY</div>
    )
    vi.mocked(VacuumReconnectWasteTube).mockReturnValue(
      <div>MOCK_VACUUM_RECONNECT_WASTE_TUBE</div>
    )
    vi.mocked(RetryStepInfo).mockReturnValue(<div>MOCK_RETRY_STEP_INFO</div>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`renders VacuumDisconnectEmptyCarboy when step is ${RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.STEPS.DISCONNECT_AND_EMPTY_CARBOY}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.STEPS.DISCONNECT_AND_EMPTY_CARBOY
    render(props)
    screen.getByText('MOCK_VACUUM_DISCONNECT_EMPTY_CARBOY')
  })

  it(`renders VacuumReconnectWasteTube when step is ${RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.STEPS.RECONNECT_WASTE_TUBE}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.STEPS.RECONNECT_WASTE_TUBE
    render(props)
    screen.getByText('MOCK_VACUUM_RECONNECT_WASTE_TUBE')
  })

  it(`renders RetryStepInfo when step is ${RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.STEPS.RETRY}`, () => {
    props.recoveryMap.step = RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.STEPS.RETRY
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
