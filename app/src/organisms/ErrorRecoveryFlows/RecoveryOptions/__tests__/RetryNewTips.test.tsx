import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import { RetryNewTips } from '../RetryNewTips'
import { SelectRecoveryOption } from '../SelectRecoveryOption'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

vi.mock('/app/molecules/Command')
vi.mock('../SelectRecoveryOption')
vi.mock('../../shared', async () => {
  const actual = await vi.importActual('../../shared')
  return {
    ...actual,
    TwoColLwInfoAndDeck: vi.fn(() => <div>MOCK_REPLACE_TIPS</div>),
    SelectTips: vi.fn(() => <div>MOCK_SELECT_TIPS</div>),
    RetryWithNewTips: vi.fn(() => <div>MOCK_RETRY_WITH_NEW_TIPS</div>),
  }
})

const render = (props: ComponentProps<typeof RetryNewTips>) => {
  return renderWithProviders(<RetryNewTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RetryNewTips', () => {
  let props: ComponentProps<typeof RetryNewTips>
  let mockProceedToRouteAndStep: Mock

  beforeEach(() => {
    mockProceedToRouteAndStep = vi.fn()

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        proceedToRouteAndStep: mockProceedToRouteAndStep,
      } as any,
    }

    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
  })

  it(`renders ReplaceTips when step is ${RECOVERY_MAP.RETRY_NEW_TIPS.STEPS.REPLACE_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.RETRY_NEW_TIPS.STEPS.REPLACE_TIPS,
      },
    }
    render(props)
    screen.getByText('MOCK_REPLACE_TIPS')
  })

  it(`renders SelectTips when step is ${RECOVERY_MAP.RETRY_NEW_TIPS.STEPS.SELECT_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.RETRY_NEW_TIPS.STEPS.SELECT_TIPS,
      },
    }
    render(props)
    screen.getByText('MOCK_SELECT_TIPS')
  })

  it(`renders RetryWithNewTips when step is ${RECOVERY_MAP.RETRY_NEW_TIPS.STEPS.RETRY}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.RETRY_NEW_TIPS.STEPS.RETRY,
      },
    }
    render(props)
    screen.getByText('MOCK_RETRY_WITH_NEW_TIPS')
  })

  it('renders SelectRecoveryOption as a fallback', () => {
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

  it(`proceeds to ${RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE} route and ${RECOVERY_MAP.DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING} step when step is ${RECOVERY_MAP.RETRY_NEW_TIPS.STEPS.DROP_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.RETRY_NEW_TIPS.STEPS.DROP_TIPS,
      },
    }
    render(props)
    expect(mockProceedToRouteAndStep).toHaveBeenCalledWith(
      RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE,
      RECOVERY_MAP.DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING
    )
  })
})
