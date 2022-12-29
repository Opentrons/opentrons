import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Networking from '../../../redux/networking'
import * as Fixtures from '../../../redux/networking/__fixtures__'
import { SelectAuthenticationType } from '../../../organisms/SetupNetwork/SelectAuthenticationType'
import { SelectWifiNetwork } from '../SelectWifiNetwork'

const mockPush = jest.fn()
const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  {
    ...Fixtures.mockWifiNetwork,
    ssid: 'baz',
  },
]

jest.mock('../../../organisms/SetupNetwork/SelectAuthenticationType')
jest.mock('../../../redux/networking')
jest.mock('../../../redux/discovery/selectors')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <SelectWifiNetwork />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockGetWifiList = Networking.getWifiList as jest.MockedFunction<
  typeof Networking.getWifiList
>
const mockSelectAuthenticationType = SelectAuthenticationType as jest.MockedFunction<
  typeof SelectAuthenticationType
>

describe('SelectNetwork', () => {
  beforeEach(() => {
    mockGetWifiList.mockReturnValue(mockWifiList)
    mockSelectAuthenticationType.mockReturnValue(
      <div>Mock SelectAuthenticationType</div>
    )
  })

  it('should render a wifi list', () => {
    const [{ getByText }] = render()
    getByText('Connect to a network')
    getByText('foo')
    getByText('bar')
    getByText('baz')
  })

  it('should render SetWifiCred when tapping a one of wifi ssid', () => {
    const [{ getByText, getByRole }] = render()
    getByText('foo')
    const button = getByRole('button', { name: 'foo' })
    fireEvent.click(button)
    getByText('Mock SelectAuthenticationType')
  })
})
