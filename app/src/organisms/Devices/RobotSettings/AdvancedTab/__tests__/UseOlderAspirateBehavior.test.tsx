import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import {
  updateSetting,
  getRobotSettings,
} from '../../../../../redux/robot-settings'

import { UseOlderAspirateBehavior } from '../UseOlderAspirateBehavior'

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
      <UseOlderAspirateBehavior settings={mockSettings} robotName="otie" />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings UseOlderAspirateBehavior', () => {
  beforeEach(() => {
    mockGetRobotSettings.mockReturnValue([mockSettings])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description and toggle button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Use older aspirate behavior')
    getByText(
      'Aspirate with the less accurate volumetric calibrations that were used before version 3.7.0. Use this if you need consistency with pre-v3.7.0 results. This only affects GEN1 P10S, P10M, P50M, and P300S pipettes.'
    )
    const toggleButton = getByRole('switch', {
      name: 'use_older_aspirate_behavior',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })
})
