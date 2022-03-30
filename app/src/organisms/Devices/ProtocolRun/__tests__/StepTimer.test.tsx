import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { StepTimer } from '../StepTimer'

const render = (props: React.ComponentProps<typeof StepTimer>) => {
  return renderWithProviders(<StepTimer {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const MOCK_RUN_STARTED = '2020-10-09T13:30:10Z'
const MOCK_COMMAND_STARTED = '2020-10-09T13:30:20Z'
const MOCK_COMMAND_COMPLETED = '2020-10-09T13:30:35Z'

describe('StepTimer', () => {
  let props: React.ComponentProps<typeof StepTimer>

  it('renders correct time when not started', () => {
    props = {
      commandStartedAt: null,
      commandCompletedAt: null,
      runStartedAt: MOCK_RUN_STARTED,
    }
    const { getByText } = render(props)
    getByText('Start: --:--:--')
    getByText('End: --:--:--')
  })

  it('renders correct time when not complete', () => {
    props = {
      commandStartedAt: MOCK_COMMAND_STARTED,
      commandCompletedAt: null,
      runStartedAt: MOCK_RUN_STARTED,
    }
    const { getByText } = render(props)
    getByText('Start: 00:00:10')
    getByText('End: --:--:--')
  })

  it('renders correct time when command complete', () => {
    props = {
      commandStartedAt: MOCK_COMMAND_STARTED,
      commandCompletedAt: MOCK_COMMAND_COMPLETED,
      runStartedAt: MOCK_RUN_STARTED,
    }
    const { getByText } = render(props)
    getByText('Start: 00:00:10')
    getByText('End: 00:00:25')
  })
})
