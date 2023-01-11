import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { mockFetchModulesSuccessMeta } from '../../../redux/modules/__fixtures__'
import { FailedToConnect } from '../FailedToConnect'
import { DISCONNECT } from '../../Devices/RobotSettings/ConnectNetwork/constants'
import { SetWifiCred } from '../SetWifiCred'

import type { RequestState } from '../../../redux/robot-api/types'

const render = (props: React.ComponentProps<typeof FailedToConnect>) => {
  return renderWithProviders(
    <MemoryRouter>
      <FailedToConnect {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockFunc = jest.fn()
const mockPush = jest.fn()
jest.mock('../SetWifiCred')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockSetWifiCred = SetWifiCred as jest.MockedFunction<typeof SetWifiCred>

const failureState = {
  status: 'failure',
  response: mockFetchModulesSuccessMeta,
  error: {
    message: 'mockError',
  },
} as RequestState

describe('ConnectedResult', () => {
  let props: React.ComponentProps<typeof FailedToConnect>

  beforeEach(() => {
    props = {
      ssid: 'mockWifi',
      requestState: failureState,
      type: DISCONNECT,
      onConnect: mockFunc,
    }
    mockSetWifiCred.mockReturnValue(<div>Mock SetWifiCred</div>)
  })

  it('should render a failure screen - incorrect password', () => {
    props.type = null
    const [{ getByText, getByRole }] = render(props)
    getByText('Oops! Incorrect password for mockWifi.')
    getByRole('button', { name: 'Try again' })
    getByRole('button', { name: 'Change network' })
  })

  it('should render a failure screen - other error cases', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Failed to connect to mockWifi.')
    getByRole('button', { name: 'Try again' })
    getByRole('button', { name: 'Change network' })
  })

  // No longer needed ToDo remove
  // it('should render SetWifiCred when tapping try again button - incorrect password', () => {
  //   props.type = null
  //   const [{ getByRole, getByText }] = render(props)
  //   const button = getByRole('button', { name: 'Try again' })
  //   fireEvent.click(button)
  //   getByText('Mock SetWifiCred')
  // })

  it('should call mock function when tapping change network button - incorrect password', () => {
    props.type = null
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Change network' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/wifi')
  })

  it('should call mock function when clicking buttons - other error cases', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Try again' })
    fireEvent.click(button)
    expect(mockFunc).toHaveBeenCalled()
  })

  it('should call mock function when tapping change network button - other error cases', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Change network' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/wifi')
  })
})
