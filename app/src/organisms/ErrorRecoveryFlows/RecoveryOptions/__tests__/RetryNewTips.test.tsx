import * as React from 'react'
import { vi, it, describe, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { mockRecoveryContentProps } from '../../__fixtures__'
import { RetryNewTips } from '../RetryNewTips'
import { ReplaceTips, SelectTips, RetryWithNewTips } from '../../shared'
import { RECOVERY_MAP } from '../../constants'

import type { Mock } from 'vitest'

vi.mock('../../shared')

const { RETRY_NEW_TIPS, DROP_TIP_FLOWS } = RECOVERY_MAP

const render = (props: React.ComponentProps<typeof RetryNewTips>) => {
  return renderWithProviders(<RetryNewTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RetryNewTips', () => {
  let props: React.ComponentProps<typeof RetryNewTips>
  let mockProceedToRouteAndStep: Mock

  beforeEach(() => {
    mockProceedToRouteAndStep = vi.fn(() => Promise.resolve())
    props = {
      ...mockRecoveryContentProps,
      recoveryMap: {
        route: RETRY_NEW_TIPS.ROUTE,
        step: RETRY_NEW_TIPS.STEPS.REPLACE_TIPS,
      },
      routeUpdateActions: {
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any,
    }

    vi.mocked(ReplaceTips).mockReturnValue(<div>MOCK_REPLACE_TIPS</div>)
    vi.mocked(SelectTips).mockReturnValue(<div>MOCK_SELECT_TIPS</div>)
    vi.mocked(RetryWithNewTips).mockReturnValue(<div>MOCK_RETRY_NEW_TIPS</div>)
  })

  it(`routes to Drop Tip flows if the step is ${RETRY_NEW_TIPS.STEPS.DROP_TIPS}`, () => {
    render({
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RETRY_NEW_TIPS.STEPS.DROP_TIPS,
      },
    })

    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      DROP_TIP_FLOWS.ROUTE,
      DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING
    )
  })

  it(`routes to ReplaceTips if the step is ${RETRY_NEW_TIPS.STEPS.REPLACE_TIPS}`, () => {
    render({
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RETRY_NEW_TIPS.STEPS.REPLACE_TIPS,
      },
    })

    screen.getByText('MOCK_REPLACE_TIPS')
  })

  it('routes to ReplaceTips if the step is not explicitly handled', () => {
    render({
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: null as any,
      },
    })

    screen.getByText('MOCK_REPLACE_TIPS')
  })

  it(`routes to Select if the step is ${RETRY_NEW_TIPS.STEPS.SELECT_TIPS}`, () => {
    render({
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RETRY_NEW_TIPS.STEPS.SELECT_TIPS,
      },
    })

    screen.getByText('MOCK_SELECT_TIPS')
  })

  it(`routes to Select if the step is ${RETRY_NEW_TIPS.STEPS.RETRY}`, () => {
    render({
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RETRY_NEW_TIPS.STEPS.RETRY,
      },
    })

    screen.getByText('MOCK_RETRY_NEW_TIPS')
  })
})
