import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useScrollPosition } from '/app/local-resources/dom-utils'
import { getLocalRobot } from '/app/redux/discovery'
import { mockConnectedRobot } from '/app/redux/discovery/__fixtures__'
import { useAccountIconInitial } from '/app/resources/access-control/useAccountIconInitial'
import { useNetworkConnection } from '/app/resources/networking/hooks/useNetworkConnection'

import { Navigation } from '..'
import { NavigationMenu } from '../NavigationMenu'

import type { ComponentProps } from 'react'

vi.mock('/app/local-resources/dom-utils')
vi.mock('/app/resources/networking/hooks/useNetworkConnection')
vi.mock('/app/redux/discovery')
vi.mock('/app/resources/access-control/useAccountIconInitial')
vi.mock('../NavigationMenu')

mockConnectedRobot.name = '12345678901234567'

const render = (props: ComponentProps<typeof Navigation>) => {
  return renderWithProviders(
    <MemoryRouter>
      <Navigation {...props} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )[0]
}

describe('Navigation', () => {
  let props: ComponentProps<typeof Navigation>
  beforeEach(() => {
    props = {}
    vi.mocked(getLocalRobot).mockReturnValue(mockConnectedRobot)
    vi.mocked(useAccountIconInitial).mockReturnValue({
      showIcon: false,
    })
    vi.mocked(NavigationMenu).mockReturnValue(<div>mock NavigationMenu</div>)
    vi.mocked(useNetworkConnection).mockReturnValue({
      isEthernetConnected: false,
      isWifiConnected: false,
      isUsbConnected: false,
      connectionStatus: 'Not connected',
    })
    vi.mocked(useScrollPosition).mockReturnValue({
      isScrolled: false,
      scrollRef: {} as any,
    })
  })
  it('should render text and they have attribute', () => {
    render(props)
    screen.getByRole('link', { name: '123456789012...' }) // because of the truncate function
    const allProtocols = screen.getByRole('link', { name: 'Protocols' })
    expect(allProtocols).toHaveAttribute('href', '/protocols')

    const instruments = screen.getByRole('link', { name: 'Instruments' })
    expect(instruments).toHaveAttribute('href', '/instruments')

    const settings = screen.getByRole('link', { name: 'Settings' })
    expect(settings).toHaveAttribute('href', '/robot-settings')

    expect(screen.queryByText('Get started')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('network icon')).not.toBeInTheDocument()
  })
  it('should render a network icon', () => {
    vi.mocked(useNetworkConnection).mockReturnValue({
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
    fireEvent.click(
      screen.getByRole('button', { name: 'overflow menu button' })
    )
    screen.getByText('mock NavigationMenu')
  })
  it('should call the setNavMenuIsOpened prop when you click on the overflow menu button', () => {
    props = {
      ...props,
      setNavMenuIsOpened: vi.fn(),
    }
    render(props)
    fireEvent.click(
      screen.getByRole('button', { name: 'overflow menu button' })
    )
    screen.getByText('mock NavigationMenu')
    expect(props.setNavMenuIsOpened).toHaveBeenCalled()
  })
  describe('account icon', () => {
    const linkName = 'Account'
    it('should not render the account control when logged out', () => {
      vi.mocked(useAccountIconInitial).mockReturnValue({
        showIcon: false,
      })
      render(props)
      expect(
        screen.queryByRole('link', { name: linkName })
      ).not.toBeInTheDocument()
    })
    it('should render the account initial and link to the account page when logged in', () => {
      vi.mocked(useAccountIconInitial).mockReturnValue({
        showIcon: true,
        iconContents: 'T',
      })
      render(props)
      const accountLink = screen.getByRole('link', { name: linkName })
      expect(accountLink).toHaveAttribute('href', '/account')
      expect(accountLink).toHaveTextContent('T')
    })
  })
})
