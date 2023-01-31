import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { Navigation } from '../../../organisms/OnDeviceDisplay/Navigation'
import { RobotDashboard } from '../RobotDashboard'

jest.mock('../../../organisms/OnDeviceDisplay/Navigation')

const mockNavigation = Navigation as jest.MockedFunction<typeof Navigation>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotDashboard />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotDashboard', () => {
  beforeEach(() => {
    mockNavigation.mockReturnValue(<div>mock Navigation</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render text, image, and buttons', () => {
    const [{ getByText }] = render()
    getByText('mock Navigation')
    getByText('Run again')
  })

  // Note test cases will be added when RobotDashboard screen is ready
})
