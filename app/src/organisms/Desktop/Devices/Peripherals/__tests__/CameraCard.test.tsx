import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useCameraUsageSettings } from '/app/local-resources/images/hooks/useCameraUsageSettings'
import { CameraControls } from '/app/organisms/Desktop/Camera/CameraControls'
import { useFeatureFlag } from '/app/redux/config'
import { useCurrentRunId, useNotifyRunQuery } from '/app/resources/runs'

import { CameraCard } from '../CameraCard'

import type { Mock } from 'vitest'
import type { CameraCardProps } from '../CameraCard'

vi.mock('/app/organisms/Desktop/Camera/CameraControls')
vi.mock('/app/local-resources/images/hooks/useCameraUsageSettings')
vi.mock('/app/resources/runs')
vi.mock('/app/redux/config')
vi.mock('/app/redux/discovery/selectors')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: CameraCardProps) => {
  return renderWithProviders(
    <MemoryRouter>
      <CameraCard {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

let mockToggleEnabled: Mock
describe('CameraCard', () => {
  let mockProps: CameraCardProps

  beforeEach(() => {
    mockProps = {
      isFlex: false,
      robotName: 'test-robot',
    }
    mockToggleEnabled = vi.fn()
    vi.mocked(CameraControls).mockReturnValue(<div>MOCK_CAMERA_CONTROLS</div>)
    vi.mocked(useCurrentRunId).mockReturnValue(null)
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: { status: RUN_STATUS_IDLE } },
    } as any)
    vi.mocked(useCameraUsageSettings).mockReturnValue({
      isCameraEnabled: true,
      toggleCameraEnabled: mockToggleEnabled,
    } as any)
    vi.mocked(useFeatureFlag).mockReturnValue(true)
  })

  it('renders camera card with OT-2 image for non-Flex robot', () => {
    render(mockProps)

    const image = screen.getByAltText('Camera')
    expect(image).toHaveAttribute('src')
    expect(image.getAttribute('src')).toContain('system_camera_ot2.png')
  })

  it('renders camera card with Flex image for Flex robot', () => {
    const flexProps = { ...mockProps, isFlex: true }
    render(flexProps)

    const image = screen.getByAltText('Camera')
    expect(image).toHaveAttribute('src')
    expect(image.getAttribute('src')).toContain('system_camera_flex.png')
  })

  it('renders on deck and camera text', () => {
    render(mockProps)

    screen.getByText('On Deck')
    screen.getByText('Camera')
  })

  it('renders enabled chip by default', () => {
    render(mockProps)

    screen.getByText('Enabled')
  })

  it('renders overflow button', () => {
    render(mockProps)

    screen.getByLabelText('overflow')
  })

  it('overflow button is not disabled when no run exists', () => {
    render(mockProps)

    const overflowButton = screen.getByLabelText('overflow')
    expect(overflowButton).not.toBeDisabled()
  })

  it('overflow button is disabled when run exists and is not idle', () => {
    vi.mocked(useCurrentRunId).mockReturnValue('test-run-id')
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: { status: RUN_STATUS_RUNNING } },
    } as any)

    render(mockProps)

    const overflowButton = screen.getByLabelText('overflow')
    expect(overflowButton).toBeDisabled()
  })

  it('opens overflow menu when overflow button is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const overflowButton = screen.getByLabelText('overflow')
    await user.click(overflowButton)

    screen.getByText('Disable camera')
    screen.getByText('Edit settings')
    screen.getByText('Usage Settings')
  })

  it('closes overflow menu when clicking outside', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const overflowButton = screen.getByLabelText('overflow')
    await user.click(overflowButton)

    screen.getByText('Disable camera')

    await user.click(document.body)

    expect(screen.queryByText('Disable camera')).not.toBeInTheDocument()
  })

  it('text shows as disabled when camera is disabled', async () => {
    userEvent.setup()
    vi.mocked(useCameraUsageSettings).mockReturnValue({
      isCameraEnabled: false,
      toggleCameraEnabled: mockToggleEnabled,
    } as any)
    render(mockProps)
    screen.getByText('Disabled')
  })

  it('enable toggle calls update camera ', async () => {
    const user = userEvent.setup()
    render(mockProps)
    const overflowButton = screen.getByLabelText('overflow')
    await user.click(overflowButton)
    await user.click(screen.getByText('Disable camera'))
    expect(mockToggleEnabled).toHaveBeenCalledOnce()
  })

  it('text shows as enabled when camera is enabled', async () => {
    userEvent.setup()
    render(mockProps)
    screen.getByText('Enabled')
  })

  it('opens CameraControls modal when edit settings is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const overflowButton = screen.getByLabelText('overflow')
    await user.click(overflowButton)

    const editSettingsOption = screen.getByText('Edit settings')
    await user.click(editSettingsOption)

    screen.getByText('MOCK_CAMERA_CONTROLS')
  })

  it('navigates to camera settings when usage settings is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const overflowButton = screen.getByLabelText('overflow')
    await user.click(overflowButton)

    const usageSettingsOption = screen.getByText('Usage Settings')
    await user.click(usageSettingsOption)

    expect(mockNavigate).toHaveBeenCalledWith(
      '/devices/test-robot/robot-settings/camera'
    )
  })

  it('navigates with correct robot name', async () => {
    const user = userEvent.setup()
    const differentRobotProps = { ...mockProps, robotName: 'different-robot' }
    render(differentRobotProps)

    const overflowButton = screen.getByLabelText('overflow')
    await user.click(overflowButton)

    await user.click(screen.getByText('Usage Settings'))

    expect(mockNavigate).toHaveBeenCalledWith(
      '/devices/different-robot/robot-settings/camera'
    )
  })

  it('closes overflow menu when menu item is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const overflowButton = screen.getByLabelText('overflow')
    await user.click(overflowButton)

    screen.getByText('Disable camera')

    await user.click(screen.getByText('Edit settings'))

    expect(screen.queryByText('Disable camera')).not.toBeInTheDocument()
  })
})
