import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { getRobotSettings } from '../../../../../redux/robot-settings'

import { GantryHoming } from '../GantryHoming'

jest.mock('../../../../../redux/robot-settings/selectors')
jest.mock('../../../hooks')

const mockGetRobotSettings = getRobotSettings as jest.MockedFunction<
  typeof getRobotSettings
>

const mockSettings = {
  id: 'homing-test',
  title: 'Disable home on boot',
  description: 'Disable home on boot test',
  value: true,
  restart_required: false,
}

const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <GantryHoming settings={mockSettings} robotName="otie" isRobotBusy />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DisableHoming', () => {
  beforeEach(() => {
    mockGetRobotSettings.mockReturnValue([mockSettings])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description and toggle button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Home Gantry on Restart')
    getByText('Homes the gantry along the z-axis.')
    const toggleButton = getByRole('switch', { name: 'gantry_homing' })
    expect(toggleButton.getAttribute('aria-checked')).toBe('false')
  })

  it('should change the value when a user clicks a toggle button', () => {
    const tempMockSettings = {
      ...mockSettings,
      value: false,
    }
    mockGetRobotSettings.mockReturnValue([tempMockSettings])
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'gantry_homing',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('false')
  })

  it('should call update robot status if a robot is busy', () => {
    const [{ getByRole }] = render(true)
    const toggleButton = getByRole('switch', {
      name: 'gantry_homing',
    })
    expect(toggleButton).toBeDisabled()
  })
})
