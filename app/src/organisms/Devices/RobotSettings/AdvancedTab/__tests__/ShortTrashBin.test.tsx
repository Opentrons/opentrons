import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import {
  updateSetting,
  getRobotSettings,
} from '../../../../../redux/robot-settings'

import { ShortTrashBin } from '../ShortTrashBin'

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
      <ShortTrashBin settings={mockSettings} robotName="otie" />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings ShortTrashBin', () => {
  beforeEach(() => {
    mockGetRobotSettings.mockReturnValue([mockSettings])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description and toggle button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Short trash bin')
    getByText(
      'For pre-2019 robots with trash bins that are 55mm tall (instead of 77mm default)'
    )
    const toggleButton = getByRole('switch', { name: 'short_trash_bin' })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })
})
