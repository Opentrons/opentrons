import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Fixtures from '../../../redux/networking/__fixtures__'
import { DisplaySearchNetwork } from '../DisplaySearchNetwork'
import { DisplayWifiList } from '../DisplayWifiList'

const mockPush = jest.fn()
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
      handleJoinAnotherNetwork: jest.fn(),
      handleNetworkPress: jest.fn(),
      isHeader: true,
    }
    mockDisplaySearchNetwork.mockReturnValue(
      <div>mock DisplaySearchNetwork</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a wifi list, button and spinner', () => {
    const [{ getByText, getByLabelText }] = render(props)
    getByText('Select a network')
    getByText('foo')
    getByText('bar')
    getByText('baz')
    getByLabelText('back-button')
  })

  it('should not render a spinner', () => {
    props = { ...props }
    const [{ queryByTestId }] = render(props)
    expect(queryByTestId('wifi_list_search_spinner')).not.toBeInTheDocument()
  })

  it('should call mock functions when back', () => {
    const [{ getByLabelText }] = render(props)
    const button = getByLabelText('back-button')
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup')
  })

  it('should call mock function when tapping tapping a ssid', () => {
    const [{ getByText }] = render(props)
    const button = getByText('foo')
    fireEvent.click(button)
    expect(props.handleNetworkPress).toHaveBeenCalledWith('foo')
  })
})
