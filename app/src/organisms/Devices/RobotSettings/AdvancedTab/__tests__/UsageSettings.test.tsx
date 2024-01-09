import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { getRobotSettings } from '../../../../../redux/robot-settings'

import { UsageSettings } from '../UsageSettings'

jest.mock('../../../../../redux/robot-settings/selectors')

const mockGetRobotSettings = getRobotSettings as jest.MockedFunction<
  typeof getRobotSettings
>

const mockSettings = {
  id: 'enableDoorSafetySwitch',
  title: 'Enable robot door safety switch',
  description:
    'Automatically pause protocols when robot door opens. Opening the robot door during a run will pause your robot only after it has completed its current motion.',
  value: true,
  restart_required: false,
}

const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <UsageSettings settings={mockSettings} robotName="otie" isRobotBusy />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings GantryHoming', () => {
  beforeEach(() => {
    mockGetRobotSettings.mockReturnValue([mockSettings])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description and toggle button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Usage Settings')
    getByText('Pause protocol when robot door opens')
    getByText(
      'When enabled, opening the robot door during a run will pause the robot after it has completed its current motion.'
    )
    const toggleButton = getByRole('switch', {
      name: 'usage_settings_pause_protocol',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should change the value when a user clicks a toggle button', () => {
    const tempMockSettings = {
      ...mockSettings,
      value: false,
    }
    mockGetRobotSettings.mockReturnValue([tempMockSettings])
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'usage_settings_pause_protocol',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should call update robot status if a robot is busy', () => {
    const [{ getByRole }] = render(true)
    const toggleButton = getByRole('switch', {
      name: 'usage_settings_pause_protocol',
    })
    expect(toggleButton).toBeDisabled()
  })
})
