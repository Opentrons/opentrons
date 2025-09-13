import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import {
  SkipStepInfo,
  StackerEnsureShuttleEmpty,
  StackerHopperLwInfo,
} from '../../shared'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { StackerShuttleEmptyStoreSkip } from '../StackerShuttleEmptyStoreSkip'

import type { ComponentProps } from 'react'

vi.mock('../SelectRecoveryOption')
vi.mock('../../shared/')

const render = (props: ComponentProps<typeof StackerShuttleEmptyStoreSkip>) => {
  return renderWithProviders(<StackerShuttleEmptyStoreSkip {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StackerShuttleEmptyStoreSkip', () => {
  let props: ComponentProps<typeof StackerShuttleEmptyStoreSkip>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      currentRecoveryOptionUtils: {
        ...mockRecoveryContentProps.currentRecoveryOptionUtils,
        selectedRecoveryOption: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE,
      },
    }
    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
    vi.mocked(StackerEnsureShuttleEmpty).mockReturnValue(
      <div>MOCK_ENSURE_SHUTTLE_EMPTY</div>
    )
    vi.mocked(StackerHopperLwInfo).mockReturnValue(
      <div>MOCK_STACKER_HOPPER_LW_INFO</div>
    )
    vi.mocked(SkipStepInfo).mockReturnValue(<div>MOCK_SKIP_STEP_INFO</div>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`renders StackerEnsureShuttleEmpty when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_SKIP.STEPS.ENSURE_SHUTTLE_EMPTY}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_SKIP.STEPS.ENSURE_SHUTTLE_EMPTY
    render(props)
    screen.getByText('MOCK_ENSURE_SHUTTLE_EMPTY')
  })

  it(`renders StackerHopperLwInfo when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_SKIP.STEPS.CHECK_HOPPER}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_SKIP.STEPS.CHECK_HOPPER
    render(props)
    screen.getByText('MOCK_STACKER_HOPPER_LW_INFO')
  })

  it(`renders SkipStepInfo when step is ${RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_SKIP.STEPS.SKIP}`, () => {
    props.recoveryMap.step =
      RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_SKIP.STEPS.SKIP
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
