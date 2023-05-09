import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import * as Fixtures from '../../../../redux/networking/__fixtures__'
import { DisplayWifiList } from '../DisplayWifiList'

const mockPush = jest.fn()
const mockSetShowSelectAuthenticationType = jest.fn()
const mockSetChangeState = jest.fn()
const mockSetSelectedSsid = jest.fn()
const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  {
    ...Fixtures.mockWifiNetwork,
    ssid: 'baz',
  },
]

jest.mock('../../../../redux/networking/selectors')
jest.mock('../../../../redux/discovery/selectors')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
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
      isSearching: true,
      setShowSelectAuthenticationType: mockSetShowSelectAuthenticationType,
      setChangeState: mockSetChangeState,
      setSelectedSsid: mockSetSelectedSsid,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a wifi list, button and spinner', () => {
    const [{ getByText, getByRole, getByTestId }] = render(props)
    getByText('Connect via Wi-Fi')
    getByText('foo')
    getByText('bar')
    getByText('baz')
    getByRole('button', { name: 'Back' })
    expect(getByTestId('wifi_list_search_spinner')).toBeInTheDocument()
  })

  it('should not render a spinner', () => {
    props = { ...props, isSearching: false }
    const [{ queryByTestId }] = render(props)
    expect(queryByTestId('wifi_list_search_spinner')).not.toBeInTheDocument()
  })

  it('should call mock functions when back', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Back' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })

  it('should call mock function when tapping tapping a ssid', () => {
    const [{ getByText }] = render(props)
    const button = getByText('foo')
    fireEvent.click(button)
    expect(props.setShowSelectAuthenticationType).toHaveBeenCalled()
    expect(props.setChangeState).toHaveBeenCalled()
    expect(props.setSelectedSsid).toHaveBeenCalled()
  })
})
