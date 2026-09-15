import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useResetRobotConfigMutation } from '/app/resources/devices/hooks/useResetRobotConfigMutation'

import { DeviceResetModal } from '../DeviceResetModal'

import type { ComponentProps } from 'react'

vi.mock('/app/resources/devices/hooks/useResetRobotConfigMutation')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const mockResetOptions = { resetLabwareOffsets: false, settingsResets: {} }
const mockCloseModal = vi.fn()
const mockPostResetConfig = vi.fn()
const ROBOT_NAME = 'otie'
const render = (props: ComponentProps<typeof DeviceResetModal>) => {
  return renderWithProviders(
    <MemoryRouter>
      <DeviceResetModal {...props} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DeviceResetModal', () => {
  beforeEach(() => {
    mockPostResetConfig.mockReset()
    vi.mocked(useResetRobotConfigMutation).mockReturnValue({
      postResetConfig: mockPostResetConfig,
      isLoading: false,
      reset: vi.fn(),
    } as any)
  })

  it('should render title, description, and buttons', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    screen.getByText('Reset to factory settings?')
    screen.getByText(
      'Resetting will erase all saved data and restart the robot. This action is permanent and cannot be undone.'
    )
    screen.getByRole('button', { name: 'Cancel' })
    screen.getByRole('button', { name: 'Confirm' })
  })

  it('should call postResetConfig when the user clicks Confirm', () => {
    const clearMockResetOptions = {
      resetLabwareOffsets: false,
      settingsResets: {
        bootScript: true,
        deckCalibration: true,
      },
    }
    render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: clearMockResetOptions,
    })
    const clearDataAndRestartRobotButton = screen.getByRole('button', {
      name: 'Confirm',
    })
    fireEvent.click(clearDataAndRestartRobotButton)
    expect(mockPostResetConfig).toBeCalledWith(clearMockResetOptions)
  })

  it('should close the modal when clicking the Cancel button', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it('should close the modal when clicking the close icon button', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: true,
      robotName: ROBOT_NAME,
      resetOptions: mockResetOptions,
    })
    const closeIconButton = screen.getByTestId(
      'ModalHeader_icon_close_Reset to factory settings?'
    )
    fireEvent.click(closeIconButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  // UNREACHABLE ROBOT
  it('should render title, description, and button-UNREACHABLE', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: false,
      robotName: ROBOT_NAME,
      resetOptions: {
        resetLabwareOffsets: false,
        settingsResets: {},
      },
    })
    screen.getByText('Connection to robot lost')
    screen.getByText(
      'The Opentrons App is unable to communicate with this robot right now. Double check the USB or Wi-Fi connection to the robot, then try to reconnect.'
    )
    screen.getByRole('button', { name: 'close' })
  })

  it('should close the modal when clicking the Close button-UNREACHABLE', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: false,
      robotName: ROBOT_NAME,
      resetOptions: {
        resetLabwareOffsets: false,
        settingsResets: {},
      },
    })

    const closeButton = screen.getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it('should close the modal when clicking the close icon button-UNREACHABLE', () => {
    render({
      closeModal: mockCloseModal,
      isRobotReachable: false,
      robotName: ROBOT_NAME,
      resetOptions: {
        resetLabwareOffsets: false,
        settingsResets: {},
      },
    })
    const closeIconButton = screen.getByTestId(
      'ModalHeader_icon_close_Connection to robot lost'
    )
    fireEvent.click(closeIconButton)
    expect(mockCloseModal).toHaveBeenCalled()
  })
})
