import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { DesktopEstopMissingModal } from '../DesktopEstopMissingModal'

const render = (
  props: React.ComponentProps<typeof DesktopEstopMissingModal>
) => {
  return renderWithProviders(<DesktopEstopMissingModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DesktopEstopMissingModal', () => {
  let props: React.ComponentProps<typeof DesktopEstopMissingModal>

  beforeEach(() => {
    props = {
      isActiveRun: true,
      robotName: 'mockFlex',
      closeModal: jest.fn(),
    }
  })

  it('should render text - active run', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByTestId('DesktopEstopMissingModal_activeRun')
    getByText('E-stop missing')
    getByText('Connect the E-stop to continue')
    getByText(
      'Your E-stop could be damaged or detached. mockFlex lost its connection to the E-stop, so it canceled the protocol. Connect a functioning E-stop to continue.'
    )
  })
  it('should render text - inactive run', () => {
    props.isActiveRun = false
    const [{ getByText, getByTestId }] = render(props)
    getByTestId('DesktopEstopMissingModal_inactiveRun')
    getByText('E-stop missing')
    getByText('Connect the E-stop to continue')
    getByText(
      'Your E-stop could be damaged or detached. mockFlex lost its connection to the E-stop, so it canceled the protocol. Connect a functioning E-stop to continue.'
    )
  })
  it('should call a mock function when clicking close icon', () => {
    const [{ getByTestId }] = render(props)
    getByTestId('ModalHeader_icon_close_E-stop missing').click()
    expect(props.closeModal).toBeCalled()
  })
})
