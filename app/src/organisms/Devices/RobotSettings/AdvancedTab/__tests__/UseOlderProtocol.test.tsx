import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { screen, fireEvent } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../../__testing-utils__'

import { i18n } from '../../../../../i18n'
import { getRobotSettings } from '../../../../../redux/robot-settings'

import { UseOlderProtocol } from '../UseOlderProtocol'

vi.mock('../../../../../redux/robot-settings/selectors')

const mockSettings = {
  id: 'disableFastProtocolUpload',
  title: 'Use older protocol analysis method',
  description:
    'Use an older, slower method of analyzing uploaded protocols. This changes how the OT-2 validates your protocol during the upload step, but does not affect how your protocol actually runs. Opentrons Support might ask you to change this setting if you encounter problems with the newer, faster protocol analysis method.',
  value: true,
  restart_required: false,
}

const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <UseOlderProtocol settings={mockSettings} robotName="otie" isRobotBusy />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings ShortTrashBin', () => {
  beforeEach(() => {
    vi.mocked(getRobotSettings).mockReturnValue([mockSettings])
  })

  it('should render title, description and toggle button', () => {
    render()
    screen.getByText('Use older protocol analysis method')
    screen.getByText(
      'Use an older, slower method of analyzing uploaded protocols. This changes how the OT-2 validates your protocol during the upload step, but does not affect how your protocol actually runs. Opentrons Support might ask you to change this setting if you encounter problems with the newer, faster protocol analysis method.'
    )

    const toggleButton = screen.getByRole('switch', {
      name: 'use_older_protocol_analysis_method',
    })
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should change the value when a user clicks a toggle button', () => {
    const tempMockSettings = {
      ...mockSettings,
      value: false,
    }
    vi.mocked(getRobotSettings).mockReturnValue([tempMockSettings])
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'use_older_protocol_analysis_method',
    })
    fireEvent.click(toggleButton)
    expect(toggleButton.getAttribute('aria-checked')).toBe('true')
  })

  it('should call update robot status if a robot is busy', () => {
    render(true)
    const toggleButton = screen.getByRole('switch', {
      name: 'use_older_protocol_analysis_method',
    })
    expect(toggleButton).toBeDisabled()
  })
})
