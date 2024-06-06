import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import * as Fixtures from '../../../redux/networking/__fixtures__'
import { DisplaySearchNetwork } from '../DisplaySearchNetwork'
import { DisplayWifiList } from '../DisplayWifiList'

import type { useHistory } from 'react-router-dom'

const mockPush = vi.fn()
const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  {
    ...Fixtures.mockWifiNetwork,
    ssid: 'baz',
  },
]

vi.mock('../../../redux/networking/selectors')
vi.mock('../../../redux/discovery/selectors')
vi.mock('../DisplaySearchNetwork')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof useHistory>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof DisplayWifiList>) => {
  return renderWithProviders(<DisplayWifiList {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DisplayWifiList', () => {
  let props: React.ComponentProps<typeof DisplayWifiList>
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
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })

  it('should call mock function when tapping tapping a ssid', () => {
    render(props)
    const button = screen.getByText('foo')
    fireEvent.click(button)
    expect(props.handleNetworkPress).toHaveBeenCalledWith('foo')
  })
})
