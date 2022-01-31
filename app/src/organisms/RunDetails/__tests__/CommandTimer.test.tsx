import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandTimer } from '../CommandTimer'

const render = (props: React.ComponentProps<typeof CommandTimer>) => {
  return renderWithProviders(<CommandTimer {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const MOCK_RUN_STARTED = '2020-10-09T13:30:10Z'
const MOCK_COMMAND_STARTED = '2020-10-09T13:30:20Z'
const MOCK_COMMAND_COMPLETED = '2020-10-09T13:30:35Z'

describe('CommandTimer', () => {
  let props: React.ComponentProps<typeof CommandTimer>

  it('renders correct time when not complete', () => {
    props = {
      commandStartedAt: MOCK_COMMAND_STARTED,
      commandCompletedAt: null,
      runStartedAt: MOCK_RUN_STARTED,
    }
    const { getByText } = render(props)
    getByText('00:00:10')
    getByText('-- : -- : --')
  })
  it('renders correct time when command complete', () => {
    props = {
      commandStartedAt: MOCK_COMMAND_STARTED,
      commandCompletedAt: MOCK_COMMAND_COMPLETED,
      runStartedAt: MOCK_RUN_STARTED,
    }
    const { getByText } = render(props)
    getByText('00:00:10')
    getByText('00:00:25')
  })
})
