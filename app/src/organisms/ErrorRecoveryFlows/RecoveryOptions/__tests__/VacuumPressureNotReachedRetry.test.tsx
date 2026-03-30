import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import {
  RetryStepInfo,
  VacuumCheckCollar,
  VacuumCheckTubeConnections,
} from '../../shared'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { VacuumPressureNotReachedRetry } from '../VacuumPressureNotReachedRetry'

import type { ComponentProps } from 'react'

vi.mock('../SelectRecoveryOption')
vi.mock('../../shared/')

const render = (
  props: ComponentProps<typeof VacuumPressureNotReachedRetry>
) => {
  return renderWithProviders(<VacuumPressureNotReachedRetry {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('VacuumPressureNotReachedRetry', () => {
  let props: ComponentProps<typeof VacuumPressureNotReachedRetry>
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
    vi.mocked(VacuumCheckCollar).mockReturnValue(
      <div>MOCK_VACUUM_CHECK_COLLAR</div>
    )
    vi.mocked(VacuumCheckTubeConnections).mockReturnValue(
      <div>MOCK_VACUUM_CHECK_TUBE_CONNECTIONS</div>
    )
    vi.mocked(RetryStepInfo).mockReturnValue(<div>MOCK_RETRY_STEP_INFO</div>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`renders VacuumCheckCollar when step is ${RECOVERY_MAP.VACUUM_PRESSURE_NOT_REACHED_RETRY.STEPS.CHECK_COLLAR}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.VACUUM_PRESSURE_NOT_REACHED_RETRY.STEPS.CHECK_COLLAR
    render(props)
    screen.getByText('MOCK_VACUUM_CHECK_COLLAR')
  })

  it(`renders VacuumCheckTubeConnections when step is ${RECOVERY_MAP.VACUUM_PRESSURE_NOT_REACHED_RETRY.STEPS.CHECK_TUBE_CONNECTIONS}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.VACUUM_PRESSURE_NOT_REACHED_RETRY.STEPS.CHECK_TUBE_CONNECTIONS
    render(props)
    screen.getByText('MOCK_VACUUM_CHECK_TUBE_CONNECTIONS')
  })

  it(`renders RetryStepInfo when step is ${RECOVERY_MAP.VACUUM_PRESSURE_NOT_REACHED_RETRY.STEPS.RETRY}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.VACUUM_PRESSURE_NOT_REACHED_RETRY.STEPS.RETRY
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
