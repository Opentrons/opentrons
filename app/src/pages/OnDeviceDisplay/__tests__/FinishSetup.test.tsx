import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getLocalRobot } from '../../../redux/discovery'
import { FinishSetup } from '../FinishSetup'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/discovery')

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

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <FinishSetup />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
      initialState: MOCK_STATE,
    }
  )
}

describe('Finish setup screen', () => {
  beforeEach(() => {
    when(mockGetLocalRobot).calledWith(MOCK_STATE).mockReturnValue(mockRobot)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render text, an image and a button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('oddtie, love it!')
    getByText('Your robot is ready to go!')
    getByRole('button', { name: 'Finish setup' })
  })

  // it('when tapping a button, call a mock function', () => {})
})
