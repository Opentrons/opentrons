import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Fixtures from '../../../redux/networking/__fixtures__'
import { DisplaySearchNetwork } from '../DisplaySearchNetwork'
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

jest.mock('../../../redux/networking/selectors')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../DisplaySearchNetwork')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockDisplaySearchNetwork = DisplaySearchNetwork as jest.MockedFunction<
  typeof DisplaySearchNetwork
>

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
      setShowSelectAuthenticationType: mockSetShowSelectAuthenticationType,
      setChangeState: mockSetChangeState,
      setSelectedSsid: mockSetSelectedSsid,
    }
    mockDisplaySearchNetwork.mockReturnValue(
      <div>mock DisplaySearchNetwork</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render text and display search network mock when looking for wifi ssids', () => {
    props.list = []
    const [{ getByText, getByTestId }] = render(props)
    getByText('Select a network')
    getByTestId('back-button')
    expect(getByTestId('wifi_list_search_spinner')).toBeInTheDocument()
    getByText('mock DisplaySearchNetwork')
  })

  it('should render wifi list and button', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('Select a network')
    getByText('foo')
    getByText('bar')
    getByText('baz')
    getByTestId('back-button')
    // ToDo (kj:05/23/2023) the spinner part will be fixed when the designer is in the office
    // expect(queryByTestId('wifi_list_search_spinner')).not.toBeInTheDocument()
  })

  // it('should not render a spinner', () => {
  //   props = { ...props, isSearching: false }
  //   const [{ queryByTestId }] = render(props)
  //   expect(queryByTestId('wifi_list_search_spinner')).not.toBeInTheDocument()
  // })

  it('should call mock functions when back', () => {
    const [{ getByTestId }] = render(props)
    const button = getByTestId('back-button')
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
