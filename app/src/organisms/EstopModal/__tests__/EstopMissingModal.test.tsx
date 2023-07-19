import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getIsOnDevice } from '../../../redux/config'
import { EstopMissingModal } from '../EstopMissingModal'

jest.mock('../../../redux/config')

const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>

const render = (props: React.ComponentProps<typeof EstopMissingModal>) => {
  return renderWithProviders(<EstopMissingModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('EstopMissingModal - Touchscreen', () => {
  let props: React.ComponentProps<typeof EstopMissingModal>

  beforeEach(() => {
    props = {
      robotName: 'mockFlex',
      closeModal: jest.fn(),
    }
    mockGetIsOnDevice.mockReturnValue(true)
  })

  it('should render text', () => {
    const [{ getByText }] = render(props)
    getByText('E-stop missing')
    getByText('Connect the E-stop to continue')
    getByText(
      'Your E-stop could be damaged or detached. mockFlex lost its connection to the E-stop, so it canceled the protocol. Connect a functioning E-stop to continue.'
    )
  })
})

describe('EstopMissingModal - Desktop', () => {
  let props: React.ComponentProps<typeof EstopMissingModal>

  beforeEach(() => {
    props = {
      robotName: 'mockFlex',
      closeModal: jest.fn(),
    }
    mockGetIsOnDevice.mockReturnValue(false)
  })

  it('should render text', () => {
    const [{ getByText }] = render(props)
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
