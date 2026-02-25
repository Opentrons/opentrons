import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import {
  SkipStepInfo,
  VacuumDisconnectEmptyCarboy,
  VacuumReconnectWasteTube,
} from '../../shared'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { VacuumCarboyFullSkip } from '../VacuumCarboyFullSkip'

import type { ComponentProps } from 'react'

vi.mock('../SelectRecoveryOption')
vi.mock('../../shared/')

const render = (props: ComponentProps<typeof VacuumCarboyFullSkip>) => {
  return renderWithProviders(<VacuumCarboyFullSkip {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('VacuumCarboyFullSkip', () => {
  let props: ComponentProps<typeof VacuumCarboyFullSkip>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      currentRecoveryOptionUtils: {
        ...mockRecoveryContentProps.currentRecoveryOptionUtils,
        selectedRecoveryOption: RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.ROUTE,
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
    vi.mocked(SkipStepInfo).mockReturnValue(<div>MOCK_SKIP_STEP_INFO</div>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`renders VacuumDisconnectEmptyCarboy when step is ${RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.STEPS.DISCONNECT_AND_EMPTY_CARBOY}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.STEPS.DISCONNECT_AND_EMPTY_CARBOY
    render(props)
    screen.getByText('MOCK_VACUUM_DISCONNECT_EMPTY_CARBOY')
  })

  it(`renders VacuumReconnectWasteTube when step is ${RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.STEPS.RECONNECT_WASTE_TUBE}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.STEPS.RECONNECT_WASTE_TUBE
    render(props)
    screen.getByText('MOCK_VACUUM_RECONNECT_WASTE_TUBE')
  })

  it(`renders SkipStepInfo when step is ${RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.STEPS.SKIP}`, () => {
    props.recoveryMap.step = RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.STEPS.SKIP
    render(props)
    screen.getByText('MOCK_SKIP_STEP_INFO')
  })

  it(`renders SelectRecoveryOption for unknown step`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS
    render(props)
    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })
})
