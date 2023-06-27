import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { InterventionCommandMessage } from '../InterventionCommandMessage'
import {
  longCommandMessage,
  shortCommandMessage,
  truncatedCommandMessage,
} from '../__fixtures__'

const render = (
  props: React.ComponentProps<typeof InterventionCommandMessage>
) => {
  return renderWithProviders(<InterventionCommandMessage {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InterventionCommandMessage', () => {
  let props: React.ComponentProps<typeof InterventionCommandMessage>

  it('truncates command text greater than 220 characters long', () => {
    props = { commandMessage: longCommandMessage }
    const { getByText } = render(props)
    expect(getByText(truncatedCommandMessage)).toBeTruthy()
  })

  it('does not truncate command text when shorter than 220 characters', () => {
    props = { commandMessage: shortCommandMessage }
    const { getByText } = render(props)
    expect(getByText(shortCommandMessage)).toBeTruthy()
  })

  it('displays a default message if pause step does not have a message', () => {
    props = { commandMessage: null }
    const { getByText } = render(props)
    expect(getByText('Pausing protocol')).toBeTruthy()
  })
})
