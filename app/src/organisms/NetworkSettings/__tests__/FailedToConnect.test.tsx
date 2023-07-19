import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
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

const failureState = {
  status: 'failure',
  response: {
    method: 'POST',
    path: '/wifi/configure',
    status: 401,
  },
  error: {
    message: 'mockError',
  },
} as RequestState

describe('ConnectedResult', () => {
  let props: React.ComponentProps<typeof FailedToConnect>

  beforeEach(() => {
    props = {
      requestState: failureState,
      selectedSsid: 'mockSsid',
      handleChangeNetwork: jest.fn(),
      handleTryAgain: jest.fn(),
      isInvalidPassword: true,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a failure screen - incorrect password', () => {
    const [{ getByText }] = render(props)
    getByText('Oops! Incorrect password for mockSsid')
    getByText('Try again')
    getByText('Change network')
  })

  it('should render a failure screen - other error cases', () => {
    props.isInvalidPassword = false
    const [{ getByText }] = render(props)
    getByText('Failed to connect to mockSsid')
    getByText('Try again')
    getByText('Change network')
  })

  it('should call handleChangeNetwork when pressing Change network', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Change network')
    button.click()
    expect(props.handleChangeNetwork).toHaveBeenCalled()
  })

  it('should call handleTryAgain when pressing Try again', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Try again')
    button.click()
    expect(props.handleTryAgain).toHaveBeenCalled()
  })
})
