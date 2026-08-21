import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  FillWell,
  RetryWithNewTips,
  SelectTips,
  TwoColLwInfoAndDeck,
} from '/app/organisms/ErrorRecoveryFlows/shared'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import { CancelRun } from '../CancelRun'
import { FillWellAndRetryNewTips } from '../FillWellAndRetryNewTips'
import { SelectRecoveryOption } from '../SelectRecoveryOption'

import type { ComponentProps } from 'react'
import type { UseRouteUpdateActionsResult } from '../../hooks'

vi.mock('../CancelRun')
vi.mock('../SelectRecoveryOption')
vi.mock('/app/organisms/ErrorRecoveryFlows/shared')

const render = (props: ComponentProps<typeof FillWellAndRetryNewTips>) => {
  return renderWithProviders(<FillWellAndRetryNewTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FillWellAndRetryNewTips', () => {
  let props: ComponentProps<typeof FillWellAndRetryNewTips>
  let mockProceedToRouteAndStep: Omit<
    UseRouteUpdateActionsResult,
    'stashedMapRef'
  >['proceedToRouteAndStep']

  beforeEach(() => {
    mockProceedToRouteAndStep = vi.fn()
    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        ...mockRecoveryContentProps.routeUpdateActions,
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      },
    }

    vi.mocked(CancelRun).mockReturnValue(<div>MOCK_CANCEL_RUN</div>)
    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
    vi.mocked(FillWell).mockReturnValue(<div>MOCK_FILL_WELL</div>)
    vi.mocked(SelectTips).mockReturnValue(<div>MOCK_SELECT_TIPS</div>)
    vi.mocked(TwoColLwInfoAndDeck).mockReturnValue(
      <div>MOCK_TWO_COL_LW_INFO_AND_DECK</div>
    )
    vi.mocked(RetryWithNewTips).mockReturnValue(
      <div>MOCK_RETRY_WITH_NEW_TIPS</div>
    )
  })

  it(`calls proceedToRouteAndStep when step is ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.DROP_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.DROP_TIPS,
      },
    }
    render(props)

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE,
      RECOVERY_MAP.DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING
    )
  })

  it(`renders FillWell when step is ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.MANUAL_FILL}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.MANUAL_FILL,
      },
    }
    render(props)

    screen.getByText('MOCK_FILL_WELL')
  })

  it(`renders TwoColLwInfoAndDeck when step is ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS,
      },
    }
    render(props)

    screen.getByText('MOCK_TWO_COL_LW_INFO_AND_DECK')
  })

  it(`renders SelectTips when step is ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.SELECT_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.SELECT_TIPS,
      },
    }
    render(props)

    screen.getByText('MOCK_SELECT_TIPS')
  })

  it(`renders RetryWithNewTips when step is ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.RETRY}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.RETRY,
      },
    }
    render(props)

    screen.getByText('MOCK_RETRY_WITH_NEW_TIPS')
  })

  it(`renders CancelRun when step is ${RECOVERY_MAP.CANCEL_RUN.STEPS.CONFIRM_CANCEL}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.CANCEL_RUN.STEPS.CONFIRM_CANCEL,
      },
    }
    render(props)

    screen.getByText('MOCK_CANCEL_RUN')
  })

  it('renders SelectRecoveryOption as a fallback for unknown steps', () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: 'UNKNOWN_STEP' as any,
      },
    }
    render(props)

    screen.getByText('MOCK_SELECT_RECOVERY_OPTION')
  })
})
