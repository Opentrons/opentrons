import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useRobotType } from '/app/redux-resources/robots'

import { SetupRunCameraUsage } from '../SetupRunCameraSettings'

import type { SetupCameraProps } from '../SetupRunCameraSettings'

vi.mock('/app/redux-resources/robots')

const render = (props: SetupCameraProps) => {
  return renderWithProviders(<SetupRunCameraUsage {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupRunCameraUsage', () => {
  let mockProps: SetupCameraProps

  beforeEach(() => {
    mockProps = {
      liveStreamEnabled: true,
      recoveryEnabled: true,
      cameraConfirmed: false,
      toggleLiveStreamEnabled: vi.fn(),
      toggleRecoveryEnabled: vi.fn(),
      robotName: 'MOCK-NAME',
    }
    vi.mocked(useRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
  })

  it('renders usage settings header', () => {
    render(mockProps)

    screen.getByText('Usage Settings')
  })

  it('renders live video setting card', () => {
    render(mockProps)

    screen.getByText('Live Video')
    screen.getByText(
      'View real-time video of the deck while a running a protocol.'
    )
  })

  it('does not render live video card if the robot is an OT-2', () => {
    vi.mocked(useRobotType).mockReturnValue(OT2_ROBOT_TYPE)
    render(mockProps)

    expect(screen.queryByText('Live Video')).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        'View real-time video of the deck while a running a protocol.'
      )
    ).not.toBeInTheDocument()
  })

  it('renders error recovery setting card', () => {
    render(mockProps)

    screen.getByText('Error Recovery')
    screen.getByText(
      'Automatically capture an image of the deck in the event of an error.'
    )
  })

  it('renders both toggle buttons', () => {
    render(mockProps)

    const toggleButtons = screen.getAllByRole('switch')
    expect(toggleButtons).toHaveLength(2)
  })

  it('calls toggleLiveVideoEnabled when live video toggle is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const toggleButtons = screen.getAllByRole('switch')
    await user.click(toggleButtons[0])

    expect(mockProps.toggleLiveStreamEnabled).toHaveBeenCalledTimes(1)
  })

  it('calls toggleRecoveryCaptureEnabled when recovery capture toggle is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const toggleButtons = screen.getAllByRole('switch')
    await user.click(toggleButtons[1])

    expect(mockProps.toggleRecoveryEnabled).toHaveBeenCalledTimes(1)
  })
})
