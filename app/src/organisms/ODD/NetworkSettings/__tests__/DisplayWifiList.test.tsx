import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mockWifiNetwork } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { DisplaySearchNetwork } from '../DisplaySearchNetwork'
import { DisplayWifiList } from '../DisplayWifiList'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()
const mockWifiList = [
  { ...mockWifiNetwork, ssid: 'foo', active: true },
  { ...mockWifiNetwork, ssid: 'bar' },
  {
    ...mockWifiNetwork,
    ssid: 'baz',
  },
]

vi.mock('/app/redux/discovery/selectors')
vi.mock('../DisplaySearchNetwork')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: ComponentProps<typeof DisplayWifiList>) => {
  return renderWithProviders(<DisplayWifiList {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DisplayWifiList', () => {
  let props: ComponentProps<typeof DisplayWifiList>
  beforeEach(() => {
    props = {
      list: mockWifiList,
      handleJoinAnotherNetwork: vi.fn(),
      handleNetworkPress: vi.fn(),
      isHeader: true,
    }
    vi.mocked(DisplaySearchNetwork).mockReturnValue(
      <div>mock DisplaySearchNetwork</div>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render a wifi list, button and spinner', () => {
    render(props)
    screen.getByText('Select a network')
    screen.getByText('foo')
    screen.getByText('bar')
    screen.getByText('baz')
    screen.getByLabelText('back-button')
  })

  it('should not render a spinner', () => {
    props = { ...props }
    render(props)
    expect(
      screen.queryByTestId('wifi_list_search_spinner')
    ).not.toBeInTheDocument()
  })

  it('should call mock functions when back', () => {
    render(props)
    const button = screen.getByLabelText('back-button')
    fireEvent.click(button)
    expect(mockNavigate).toHaveBeenCalledWith('/network-setup')
  })

  it('should call mock function when tapping tapping a ssid', () => {
    render(props)
    const button = screen.getByText('foo')
    fireEvent.click(button)
    expect(props.handleNetworkPress).toHaveBeenCalledWith('foo')
  })
})
