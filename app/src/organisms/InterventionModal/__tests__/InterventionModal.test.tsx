import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { InterventionModal } from '..'
import {
  mockPauseCommandWithNoMessage,
  mockPauseCommandWithoutStartTime,
  mockPauseCommandWithShortMessage,
  mockPauseCommandWithStartTime,
  shortCommandText,
  truncatedCommandMessage,
} from '../__fixtures__'

const ROBOT_NAME = 'Otie'

const render = (props: React.ComponentProps<typeof InterventionModal>) => {
  return renderWithProviders(<InterventionModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InterventionModal', () => {
  let props: React.ComponentProps<typeof InterventionModal>
  beforeEach(() => {
    props = { robotName: ROBOT_NAME, command: mockPauseCommandWithStartTime }
  })

  it('renders an InterventionModal with the robot name in the header, learn more link, and confirm button', () => {
    const { getByText, getByRole } = render(props)
    expect(getByText('Perform manual step on Otie')).toBeTruthy()
    expect(getByText('Learn more about user interventions')).toBeTruthy()
    expect(getByRole('button', { name: 'Confirm and resume' })).toBeTruthy()
  })

  it('renders a pause intervention modal given a pause-type command', () => {
    const { getByText } = render(props)
    expect(getByText(truncatedCommandMessage)).toBeTruthy()
    expect(getByText(/Paused for [0-9]{2}:[0-9]{2}:[0-9]{2}/)).toBeTruthy()
  })

  it('renders a pause intervention modal with an empty timestamp when no start time given', () => {
    props = { ...props, command: mockPauseCommandWithoutStartTime }
    const { getByText } = render(props)
    expect(getByText('Paused for --:--:--')).toBeTruthy()
  })

  it('does not truncate command text when shorter than 220 characters', () => {
    props = { ...props, command: mockPauseCommandWithShortMessage }
    const { getByText } = render(props)
    expect(getByText(shortCommandText)).toBeTruthy()
  })

  it('displays a default message if pause step does not have a message', () => {
    props = { ...props, command: mockPauseCommandWithNoMessage }
    const { getByText } = render(props)
    expect(getByText('Pausing protocol')).toBeTruthy()
  })
})
