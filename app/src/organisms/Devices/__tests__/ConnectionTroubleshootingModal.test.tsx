import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { ConnectionTroubleshootingModal } from '../ConnectionTroubleshootingModal'

const render = (
  props: React.ComponentProps<typeof ConnectionTroubleshootingModal>
) => {
  return renderWithProviders(<ConnectionTroubleshootingModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConnectionTroubleshootingModal', () => {
  let props: React.ComponentProps<typeof ConnectionTroubleshootingModal>
  beforeEach(() => {
    props = {
      onClose: jest.fn(),
    }
  })
  it('should render correct text', () => {
    const { getByText, getByRole } = render(props)
    getByText('Why is this robot unavailable?')
    getByText(
      'If you’re having trouble with the robot’s connection, try these troubleshooting tasks. First, double check that the robot is powered on.'
    )
    getByText('Wait for a minute after connecting the robot to the computer')
    getByText('Make sure the robot is connected to this computer')
    getByText('If connecting wirelessly:')
    getByText('Check that the computer and robot are on the same network')
    getByText('If connecting via USB:')
    getByText('If you’re still having issues:')
    getByText('Restart the robot')
    getByText('Restart the app')
    getByText(
      'If none of these work, contact Opentrons Support for help (via the question mark link in this app, or by emailing support@opentrons.com.)'
    )
    getByRole('link', {
      name: 'Learn more about troubleshooting connection problems',
    })
  })
  it('should render button and button is clickable', () => {
    const { getByRole } = render(props)
    const btn = getByRole('button', { name: 'close' })
    fireEvent.click(btn)
    expect(props.onClose).toHaveBeenCalled()
  })
})
