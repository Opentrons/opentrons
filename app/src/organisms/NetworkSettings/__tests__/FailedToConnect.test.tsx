import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { mockFetchModulesSuccessMeta } from '../../../redux/modules/__fixtures__'
import { DISCONNECT } from '../../Devices/RobotSettings/ConnectNetwork/constants'
import { FailedToConnect } from '../FailedToConnect'

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
const mockSetChangeState = jest.fn()
const mockSetCurrentRequestState = jest.fn()

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
      setChangeState: mockSetChangeState,
      setCurrentRequestState: mockSetCurrentRequestState,
    }
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

  it('should call mock function when tapping change network - incorrect password', () => {
    props.type = null
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Change network' })
    fireEvent.click(button)
    expect(props.setChangeState).toHaveBeenCalled()
  })

  it('should call mock function when tapping change network - other error cases', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Change network' })
    fireEvent.click(button)
    expect(props.setChangeState).toHaveBeenCalled()
  })

  it('should call mock function when tapping try again - incorrect password', () => {
    props.type = null
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Try again' })
    fireEvent.click(button)
    expect(props.setCurrentRequestState).toHaveBeenCalled()
  })

  it('should call mock function when tapping try again - other error cases', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Try again' })
    fireEvent.click(button)
    expect(props.onConnect).toHaveBeenCalled()
  })
})
