import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { getRobotSettings } from '../../../../../redux/robot-settings'

import { ShortTrashBin } from '../ShortTrashBin'

jest.mock('../../../../../redux/robot-settings/selectors')

const mockGetRobotSettings = getRobotSettings as jest.MockedFunction<
  typeof getRobotSettings
>

let mockIsRobotBusy = false

const mockSettings = {
  id: 'shortFixedTrash',
  title: 'Short (55mm) fixed trash',
  description: 'Trash box is 55mm tall (rather than the 77mm default)',
  value: true,
  restart_required: false,
}

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ShortTrashBin
        settings={mockSettings}
        robotName="otie"
        isRobotBusy={mockIsRobotBusy}
      />
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

  it('should change the value when a user clicks a toggle button', () => {
    const tempMockSettings = {
      ...mockSettings,
      value: false,
    }
    mockGetRobotSettings.mockReturnValue([tempMockSettings])
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'short_trash_bin',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should call update robot status if a robot is busy', () => {
    mockIsRobotBusy = true
    const [{ getByRole }] = render()
    const toggleButton = getByRole('switch', {
      name: 'short_trash_bin',
    })
    expect(toggleButton).toBeDisabled()
  })
})
