import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { mockFetchModulesSuccessMeta } from '../../../redux/modules/__fixtures__'
import { ConnectedResult } from '../ConnectedResult'

import type { RequestState } from '../../../redux/robot-api/types'

const render = (props: React.ComponentProps<typeof ConnectedResult>) => {
  return renderWithProviders(
    <MemoryRouter>
      <ConnectedResult {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockFunc = jest.fn()
const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const successState = {
  status: 'success',
  response: mockFetchModulesSuccessMeta,
} as RequestState

const failureState = {
  status: 'failure',
  response: mockFetchModulesSuccessMeta,
  error: {
    message: 'mockError',
  },
} as RequestState

describe('ConnectedResult', () => {
  let props: React.ComponentProps<typeof ConnectedResult>

  beforeEach(() => {
    props = {
      ssid: 'mockWifi',
      isConnected: true,
      requestState: successState,
      onConnect: mockFunc,
    }
  })

  it('should render a success screen when the status is success', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Connected to mockWifi')
    getByRole('button', { name: 'Change network' })
    getByRole('button', { name: 'Done' })
  })

  it('should call mock function when clicking buttons - success', () => {
    const [{ getByRole }] = render(props)
    const changeNetworkButton = getByRole('button', { name: 'Change network' })
    fireEvent.click(changeNetworkButton)
    expect(mockPush).toHaveBeenCalledWith('/select-network')
    const doneButton = getByRole('button', { name: 'Done' })
    fireEvent.click(doneButton)
    expect(mockPush).toHaveBeenCalledWith('/connectedNetworkInfo/mockWifi')
  })

  it('should render a failure screen when the status is failed', () => {
    props.isConnected = false
    props.requestState = failureState
    const [{ getByText, getByRole }] = render(props)
    getByText('Failed to connect to mockWifi')
    getByRole('button', { name: 'Try again' })
    getByRole('button', { name: 'Change network' })
  })

  it('should call mock function when clicking buttons - failure', () => {
    props.isConnected = false
    props.requestState = failureState
    const [{ getByRole }] = render(props)
    const tryAgainButton = getByRole('button', { name: 'Try again' })
    fireEvent.click(tryAgainButton)
    expect(mockFunc).toHaveBeenCalled()
    const changeNetworkButton = getByRole('button', { name: 'Change network' })
    fireEvent.click(changeNetworkButton)
    expect(mockPush).toHaveBeenCalledWith('/select-network')
  })
})
