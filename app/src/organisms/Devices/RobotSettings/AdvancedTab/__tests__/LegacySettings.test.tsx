import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'

import {
  updateSetting,
  getRobotSettings,
} from '../../../../../redux/robot-settings'

import { LegacySettings } from '../LegacySettings'

jest.mock('../../../../../redux/robot-settings/selectors')

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
      <LegacySettings settings={mockSettings} robotName="otie" />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings LegacySettings', () => {
  beforeEach(() => {
    mockGetRobotSettings.mockReturnValue([mockSettings])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description, and toggle button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Legacy Settings')
    getByText('Calibrate deck to dots')
    getByText(
      'For pre-2019 robots that do not have crosses etched on the deck.'
    )
    const toggleButton = getByRole('switch', { name: 'legacy_settings' })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })
})
