import * as React from 'react'
import { renderWithProviders, nestedTextMatcher } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { UpdateResultsModal } from '../UpdateResultsModal'

const render = (props: React.ComponentProps<typeof UpdateResultsModal>) => {
  return renderWithProviders(<UpdateResultsModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UpdateResultsModal', () => {
  let props: React.ComponentProps<typeof UpdateResultsModal>
  beforeEach(() => {
    props = {
      isSuccess: true,
      closeModal: jest.fn(),
      instrument: {
        ok: true,
        subsystem: 'gripper',
        instrumentModel: 'gripper',
      } as any,
    }
  })
  it('renders correct text for a successful instrument update', () => {
    const { getByText } = render(props)
    getByText('Successful update!')
    getByText(nestedTextMatcher('Your Gripper is ready to use!'))
  })
  it('calls close modal when the close button is pressed', () => {
    const { getByText } = render(props)
    getByText('Close').click()
    expect(props.closeModal).toHaveBeenCalled()
  })
  it('renders correct text for a failed instrument update', () => {
    props = {
      isSuccess: false,
      closeModal: jest.fn(),
      instrument: {
        ok: false,
      } as any,
    }
    const { getByText } = render(props)
    getByText('Update failed')
    getByText(
      'Download the robot logs from the Opentrons App and send them to support@opentrons.com for assistance.'
    )
  })
})
