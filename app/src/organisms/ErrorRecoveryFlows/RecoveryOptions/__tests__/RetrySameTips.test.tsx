import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { RetryWithSameTips } from '/app/organisms/ErrorRecoveryFlows/shared'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { RECOVERY_MAP } from '../../constants'
import { RetrySameTips } from '../RetrySameTips'
import { SelectRecoveryOption } from '../SelectRecoveryOption'

import type { ComponentProps } from 'react'

vi.mock('/app/molecules/Command')
vi.mock('../SelectRecoveryOption')
vi.mock('/app/organisms/ErrorRecoveryFlows/shared')

const render = (props: ComponentProps<typeof RetrySameTips>) => {
  return renderWithProviders(<RetrySameTips {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RetrySameTips', () => {
  let props: ComponentProps<typeof RetrySameTips>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }

    vi.mocked(SelectRecoveryOption).mockReturnValue(
      <div>MOCK_SELECT_RECOVERY_OPTION</div>
    )
    vi.mocked(RetryWithSameTips).mockReturnValue(
      <div>MOCK_RETRY_WITH_SAME_TIPS</div>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`renders RetryWithSameTips when step is ${RECOVERY_MAP.RETRY_SAME_TIPS.STEPS.RETRY}`, () => {
    props = {
      ...props,
      recoveryMap: {
        ...props.recoveryMap,
        step: RECOVERY_MAP.RETRY_SAME_TIPS.STEPS.RETRY,
      },
    }
    render(props)
    screen.getByText('MOCK_RETRY_WITH_SAME_TIPS')
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
