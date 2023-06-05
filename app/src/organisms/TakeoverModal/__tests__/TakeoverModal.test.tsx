import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { TakeoverModal } from '../TakeoverModal'

const render = (props: React.ComponentProps<typeof TakeoverModal>) => {
  return renderWithProviders(<TakeoverModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TakeoverModal', () => {
  let props: React.ComponentProps<typeof TakeoverModal>
  beforeEach(() => {
    props = {
      showConfirmTerminateModal: false,
      setShowConfirmTerminateModal: jest.fn(),
      confirmTerminate: jest.fn(),
      terminateInProgress: false,
    }
  })

  it('renders information for Robot is busy modal', () => {
    const { getByText } = render(props)
    getByText('Robot is busy')
    getByText(
      'A computer with the Opentrons App is currently controlling this robot.'
    )
    getByText('Terminate remote activity').click()
    expect(props.setShowConfirmTerminateModal).toHaveBeenCalled()
  })

  it('renders information for confirm terminate modal', () => {
    props = {
      ...props,
      showConfirmTerminateModal: true,
    }
    const { getByText, getByLabelText } = render(props)
    getByText('Terminate activity?')
    getByText(
      'This will immediately stop the activity begun on a computer. You, or another user, may lose progress or see an error in the Opentrons App.'
    )
    getByText('Continue activity')
    getByText('Terminate activity')
    getByLabelText('SmallButton_primary').click()
    expect(props.setShowConfirmTerminateModal).toHaveBeenCalled()
    getByLabelText('SmallButton_alert').click()
    expect(props.confirmTerminate).toHaveBeenCalled()
  })
})
