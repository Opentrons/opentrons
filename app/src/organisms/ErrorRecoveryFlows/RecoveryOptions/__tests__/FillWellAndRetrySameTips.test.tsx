import { describe, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  FillWell,
  RetryWithSameTips,
} from '/app/organisms/ErrorRecoveryFlows/shared'
import { RECOVERY_MAP } from '../../constants'
import { CancelRun } from '../CancelRun'
import { SelectRecoveryOption } from '../SelectRecoveryOption'
import { FillWellAndRetrySameTips } from '../FillWellAndRetrySameTips'

import type { ComponentProps } from 'react'

vi.mock('../CancelRun')
vi.mock('../SelectRecoveryOption')
vi.mock('/app/organisms/ErrorRecoveryFlows/shared')

const render = (props: ComponentProps<typeof FillWellAndRetrySameTips>) => {
  return renderWithProviders(<FillWellAndRetrySameTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FillWellAndSkip', () => {
  let props: ComponentProps<typeof FillWellAndRetrySameTips>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }

    vi.mocked(CancelRun).mockReturnValue(<div>MOCK_CANCEL_RUN</div>)
    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
    vi.mocked(FillWell).mockReturnValue(<div>MOCK_FILL_WELL</div>)
    vi.mocked(RetryWithSameTips).mockReturnValue(
      <div>MOCK_RETRY_WITH_SAME_TIPS</div>
    )
  })

  it(`renders FillWell when step is ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.MANUAL_FILL}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.MANUAL_FILL,
      },
    }
    render(props)

    screen.getByText('MOCK_FILL_WELL')
  })

  it(`renders SkipToNextStep when step is ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step:
          RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS,
      },
    }
    render(props)
    screen.getByText('MOCK_RETRY_WITH_SAME_TIPS')
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
})
