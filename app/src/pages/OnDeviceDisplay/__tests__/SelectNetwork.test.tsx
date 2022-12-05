import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getWifiList } from '../../../redux/networking'
import * as Fixtures from '../../../redux/networking/__fixtures__'
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

jest.mock('../../../redux/networking/selectors')
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

const mockGetWifiList = getWifiList as jest.MockedFunction<typeof getWifiList>

describe('SelectNetwork', () => {
  beforeEach(() => {
    mockGetWifiList.mockReturnValue(mockWifiList)
  })

  it('should render a wifi list', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Connect to a network')
    getByRole('button', { name: 'Search again' })
    getByText('foo')
    getByText('bar')
    getByText('baz')
  })

  it('should call mock function when tapping a one of wifi ssid', () => {
    const [{ getByText }] = render()
    const ssid = getByText('foo')
    fireEvent.click(ssid)
    expect(mockPush).toHaveBeenCalledWith('/set-wifi-cred/foo')
  })

  it('should call mock function when tapping search again', () => {
    const [{ getByRole, queryByText }, { dispatch }] = render()
    const button = getByRole('button', { name: 'Search again' })
    fireEvent.click(button)
    expect(dispatch).toHaveBeenCalled()
    expect(queryByText('Searching')).toBeInTheDocument()
  })
})
