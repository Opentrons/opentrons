import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { InfoMessage } from '..'

const render = (props: React.ComponentProps<typeof InfoMessage>) => {
  return renderWithProviders(<InfoMessage {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InfoMessage', () => {
  let props: React.ComponentProps<typeof InfoMessage>

  beforeEach(() => {
    props = {
      title: 'a message from otie',
    }
  })
  it('renders info message', () => {
    const { getByText, getByLabelText } = render(props)
    getByLabelText('icon_information')
    getByText('a message from otie')
  })
  it('renders info message body', () => {
    props = {
      title: 'a message from otie',
      body: 'the run has started',
    }
    const { getByText } = render(props)
    getByText('the run has started')
  })
})
