import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import {
  updateSetting,
  getRobotSettings,
} from '../../../../../redux/robot-settings'

import { UsageSettings } from '../UsageSettings'

jest.mock('../../../../../redux/robot-settings/selectors')

const mockUpdateSetting = updateSetting as jest.MockedFunction<
  typeof updateSetting
>

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

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <UsageSettings settings={mockSettings} robotName="otie" />
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

  it('should update the value when a user clicks a toggole button', () => {
    const tempMockSettings = {
      id: 'homing-test',
      title: 'Disable home on boot',
      description: 'Disable home on boot test',
      value: false,
      restart_required: false,
    }
    // const tempSettings = { ...mockSettings, value: false }
    updateSetting('otie', tempMockSettings.id, tempMockSettings.value)
    // mockGetRobotSettings.mockReturnValue([tempMockSettings])
    const [{ getByRole }] = render()
    // const toggleButton = getByRole('switch', { name: 'disable_homing' })
    // fireEvent.click(toggleButton)
    // expect(toggleButton).getAttribute('aria-checked', 'false')
    // expect(toggleButton.getAttribute('aria-checked')).toBe('false')
  })
})
