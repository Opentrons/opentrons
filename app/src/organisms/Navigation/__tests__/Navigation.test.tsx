import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useNetworkConnection } from '../../../pages/OnDeviceDisplay/hooks'
import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { NavigationMenu } from '../NavigationMenu'
import { Navigation } from '..'
import { fireEvent, screen } from '@testing-library/react'

jest.mock('../../../pages/OnDeviceDisplay/hooks/useNetworkConnection')
jest.mock('../../../redux/discovery')
jest.mock('../NavigationMenu')

const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockNavigationMenu = NavigationMenu as jest.MockedFunction<
  typeof NavigationMenu
>
const mockUseNetworkConnection = useNetworkConnection as jest.MockedFunction<
  typeof useNetworkConnection
>
const mockComponent = () => null

const mockRoutes = [
  {
    Component: mockComponent,
    exact: true,
    name: 'Get started',
    path: '/get-started',
  },
  {
    Component: mockComponent,
    exact: true,
    name: 'All Protocols',
    navLinkTo: '/protocols',
    path: '/protocols',
  },
  {
    Component: mockComponent,
    exact: true,
    name: 'Instruments',
    navLinkTo: '/instruments',
    path: '/instruments',
  },
  {
    Component: mockComponent,
    exact: true,
    name: 'Settings',
    navLinkTo: '/robot-settings',
    path: '/robot-settings',
  },
]

mockConnectedRobot.name = '12345678901234567'

class MockIntersectionObserver {
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

const render = (props: React.ComponentProps<typeof Navigation>) => {
  return renderWithProviders(
    <MemoryRouter>
      <Navigation {...props} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )[0]
}

describe('Navigation', () => {
  let props: React.ComponentProps<typeof Navigation>
  beforeEach(() => {
    props = {
      routes: mockRoutes,
    }
    mockGetLocalRobot.mockReturnValue(mockConnectedRobot)
    mockNavigationMenu.mockReturnValue(<div>mock NavigationMenu</div>)
    mockUseNetworkConnection.mockReturnValue({
      isEthernetConnected: false,
      isWifiConnected: false,
      isUsbConnected: false,
      connectionStatus: 'Not connected',
    })
  })
  it('should render text and they have attribute', () => {
    render(props)
    screen.getByRole('link', { name: '123456789012...' }) // because of the truncate function
    const allProtocols = screen.getByRole('link', { name: 'All Protocols' })
    expect(allProtocols).toHaveAttribute('href', '/protocols')

    const instruments = screen.getByRole('link', { name: 'Instruments' })
    expect(instruments).toHaveAttribute('href', '/instruments')

    const settings = screen.getByRole('link', { name: 'Settings' })
    expect(settings).toHaveAttribute('href', '/robot-settings')

    expect(screen.queryByText('Get started')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('network icon')).not.toBeInTheDocument()
  })
  it('should render a network icon', () => {
    mockUseNetworkConnection.mockReturnValue({
      isEthernetConnected: false,
      isWifiConnected: true,
      isUsbConnected: false,
      connectionStatus: 'Not connected',
      icon: 'wifi',
    })
    render(props)
    expect(screen.getByLabelText('network icon')).toBeInTheDocument()
  })
  it('should render the overflow btn and clicking on it renders the menu', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'overflow menu button' }))
    screen.getByText('mock NavigationMenu')
  })
  it('should call the setNavMenuIsOpened prop when you click on the overflow menu button', () => {
    props = {
      ...props,
      setNavMenuIsOpened: jest.fn(),
    }
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'overflow menu button' }))
    screen.getByText('mock NavigationMenu')
    expect(props.setNavMenuIsOpened).toHaveBeenCalled()
  })
  it('should change z index of nav bar when longPressModalIsOpened is defined and true', () => {
    props = {
      ...props,
      longPressModalIsOpened: true,
    }
    render(props)
    expect(screen.getByLabelText('Navigation_container')).toHaveStyle({ zIndex: 0 })
  })
})
