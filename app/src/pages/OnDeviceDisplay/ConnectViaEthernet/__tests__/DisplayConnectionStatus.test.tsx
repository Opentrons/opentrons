import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { DisplayConnectionStatus } from '../DisplayConnectionStatus'

const mockFunc = jest.fn()
const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (
  props: React.ComponentProps<typeof DisplayConnectionStatus>
) => {
  return renderWithProviders(<DisplayConnectionStatus {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DisplayConnectionStatus', () => {
  let props: React.ComponentProps<typeof DisplayConnectionStatus>

  beforeEach(() => {
    props = {
      isConnected: true,
      setShowNetworkDetailsModal: mockFunc,
    }
  })

  it('should render text, icon, and buttons when the connection status is connected', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByTestId('Ethernet_connected_icon')
    getByText('Successfully connected!')
    getByText('View network details')
    getByText('Continue')
  })

  it('should render text, icon, and buttons when the connection status is not connected', () => {
    props.isConnected = false
    const [{ getByText, getByTestId }] = render(props)
    getByTestId('Ethernet_not_connected_icon')
    getByText('No network found')
    getByText(
      'Connect an Ethernet cable to the back of the robot and a network switch or hub.'
    )
    getByText('View network details')
  })

  it('should call a mock function when tapping view network details button when the connection status is connected', () => {
    const [{ getByText }] = render(props)
    const button = getByText('View network details')
    button.click()
    expect(mockFunc).toHaveBeenCalled()
  })

  it('should call a mock function when tapping view network details button when the connection status is not connected', () => {
    const [{ getByText }] = render(props)
    const button = getByText('View network details')
    button.click()
    expect(mockFunc).toHaveBeenCalled()
  })

  it('should call a mock push when tapping continue button', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Continue')
    button.click()
    expect(mockPush).toHaveBeenCalledWith('/robot-settings/update-robot')
  })
})
