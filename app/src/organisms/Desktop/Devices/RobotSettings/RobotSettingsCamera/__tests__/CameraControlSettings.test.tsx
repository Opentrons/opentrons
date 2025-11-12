import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { CameraControls } from '/app/organisms/Desktop/Camera/CameraControls'

import { RobotSettingsCameraControls } from '../RobotSettingsCameraControls'

vi.mock('/app/organisms/Desktop/Camera/CameraControls')

const render = () => {
  return renderWithProviders(<RobotSettingsCameraControls />, {
    i18nInstance: i18n,
  })
}

describe('RobotSettingsCameraControls', () => {
  beforeEach(() => {
    vi.mocked(CameraControls).mockReturnValue(<div>MOCK_CAMERA_CONTROLS</div>)
  })

  it('renders camera controls header', () => {
    render()

    screen.getByText('Camera Controls')
  })

  it('renders image and video settings section', () => {
    render()

    screen.getByText('Image and Video Settings')
    screen.getByText(
      'Configure the camera’s zoom, brightness, contrast, and saturation.'
    )
  })

  it('renders edit settings button', () => {
    render()

    screen.getByText('Edit settings')
  })

  it('does not render CameraControls modal initially', () => {
    render()

    expect(screen.queryByText('MOCK_CAMERA_CONTROLS')).not.toBeInTheDocument()
  })

  it('opens CameraControls modal when edit settings button is clicked', async () => {
    const user = userEvent.setup()
    render()

    const editButton = screen.getByText('Edit settings')
    await user.click(editButton)

    screen.getByText('MOCK_CAMERA_CONTROLS')
  })

  it('toggles CameraControls modal on multiple clicks', async () => {
    const user = userEvent.setup()
    render()

    const editButton = screen.getByText('Edit settings')

    await user.click(editButton)
    screen.getByText('MOCK_CAMERA_CONTROLS')

    await user.click(editButton)
    expect(screen.queryByText('MOCK_CAMERA_CONTROLS')).not.toBeInTheDocument()

    await user.click(editButton)
    screen.getByText('MOCK_CAMERA_CONTROLS')
  })
})
