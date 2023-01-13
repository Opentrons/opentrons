import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getLocalRobot } from '../../../redux/discovery'
import { ConfirmRobotName } from '../ConfirmRobotName'

import type { State } from '../../../redux/types'

const mockPush = jest.fn()

jest.mock('../../../redux/discovery')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const MOCK_STATE: State = {
  discovery: {
    robot: { connection: { connectedTo: null } },
    robotsByName: {
      oddtie: {
        name: 'oddtie',
        health: null,
        serverHealth: null,
        addresses: [
          {
            ip: '127.0.0.1',
            port: 31950,
            seen: true,
            healthStatus: null,
            serverHealthStatus: null,
            healthError: null,
            serverHealthError: null,
            advertisedModel: null,
          },
        ],
      },
    },
  },
} as any

const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>

const mockRobot = {
  name: 'oddtie',
  status: null,
  health: null,
  ip: '127.0.0.1',
  port: 31950,
  healthStatus: null,
  serverHealthStatus: null,
} as any

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/network-setup/confirm-name/:robotName">
        <ConfirmRobotName />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
      initialState: MOCK_STATE,
    }
  )
}

describe('ConfirmRobotName', () => {
  beforeEach(() => {
    when(mockGetLocalRobot).calledWith(MOCK_STATE).mockReturnValue(mockRobot)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render text, an image and a button', () => {
    const [{ getByText, getByRole }] = render(
      '/network-setup/confirm-name/oddtie'
    )
    getByText('oddtie, love it!')
    getByText('Your robot is ready to go!')
    getByRole('button', { name: 'Finish setup' })
  })

  it('when tapping a button, call a mock function', () => {
    const [{ getByRole }] = render('/network-setup/confirm-name/oddtie')
    const button = getByRole('button', { name: 'Finish setup' })
    fireEvent.click(button)
    expect(mockPush).toBeCalledWith('/dashboard')
  })
})
