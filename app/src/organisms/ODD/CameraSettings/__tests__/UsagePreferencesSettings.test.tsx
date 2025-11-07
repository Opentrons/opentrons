import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { OnOffToggle } from '/app/organisms/ODD/RobotSettingsDashboard'

import { UsagePreferencesSettings } from '../UsagePreferencesSettings'

import type { UsagePreferencesSettingsProps } from '../UsagePreferencesSettings'

vi.mock('/app/organisms/ODD/RobotSettingsDashboard')
vi.mock('/app/redux/discovery/selectors')

const render = (props: UsagePreferencesSettingsProps) => {
  return renderWithProviders(<UsagePreferencesSettings {...props} />, {
    i18nInstance: i18n,
  })
}

describe('UsagePreferencesSettings', () => {
  let mockProps: UsagePreferencesSettingsProps

  beforeEach(() => {
    mockProps = {
      toggleLiveVideoEnabled: vi.fn(),
      toggleRecoveryCaptureEnabled: vi.fn(),
      isLiveVideoEnabled: true,
      isRecoveryCaptureEnabled: true,
      robotName: 'robotName',
    }
    vi.mocked(OnOffToggle).mockImplementation(({ isOn }) => (
      <div>MOCK_ON_OFF_TOGGLE_{isOn ? 'ON' : 'OFF'}</div>
    ))
  })

  it('renders usage preferences header', () => {
    render(mockProps)

    screen.getByText('Usage preferences')
  })

  it('renders live video setting card', () => {
    render(mockProps)

    screen.getByText('Live video')
    screen.getByText('View real-time video of the deck during protocol runs.')
  })

  it('renders error recovery setting card', () => {
    render(mockProps)

    screen.getByText('Error recovery')
    screen.getByText('Automatically capture an image of the deck on error.')
  })

  it('calls toggleLiveVideoEnabled when live video button is clicked', () => {
    render(mockProps)

    const listButton = screen.getByText('Live video')
    fireEvent.click(listButton)

    expect(mockProps.toggleLiveVideoEnabled).toHaveBeenCalledTimes(1)
  })

  it('calls toggleRecoveryCaptureEnabled when recovery capture button is clicked', async () => {
    render(mockProps)

    const listButton = screen.getByText('Error recovery')
    fireEvent.click(listButton)

    expect(mockProps.toggleRecoveryCaptureEnabled).toHaveBeenCalledTimes(1)
  })
})
