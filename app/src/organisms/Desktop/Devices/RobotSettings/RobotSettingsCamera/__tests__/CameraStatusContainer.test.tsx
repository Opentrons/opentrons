import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { CameraStatusContainer } from '../CameraStatusContainer'

import type { CameraStatusContainerProps } from '../CameraStatusContainer'

const render = (props: CameraStatusContainerProps) => {
  return renderWithProviders(<CameraStatusContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CameraStatusContainer', () => {
  let mockProps: CameraStatusContainerProps

  beforeEach(() => {
    mockProps = {
      toggleCameraEnabled: vi.fn(),
      isCameraEnabled: false,
      toggleDisabled: false,
      isFlex: true,
    }
  })

  it('renders camera status header', () => {
    render(mockProps)

    screen.getByText('Camera Status')
  })

  it('renders camera status description for the Flex', () => {
    render(mockProps)

    screen.getByText(
      'The deck camera offers live video monitoring during protocol runs and can capture images manually, automatically, or when an error occurs for easier troubleshooting.'
    )
  })

  it('renders camera status description for the OT-2', () => {
    render({ ...mockProps, isFlex: false })

    screen.getByText(
      'The deck camera can capture images manually, automatically, or when an error occurs for easier troubleshooting.'
    )
  })

  it('renders disabled chip when camera is disabled', () => {
    render(mockProps)

    screen.getByText('Disabled')
  })

  it('renders enabled chip when camera is enabled', () => {
    const propsWithCameraEnabled = {
      ...mockProps,
      isCameraEnabled: true,
    }
    render(propsWithCameraEnabled)

    screen.getByText('Enabled')
  })

  it('calls toggleCameraEnabled when toggle button is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const toggleButton = screen.getByRole('switch')
    await user.click(toggleButton)

    expect(mockProps.toggleCameraEnabled).toHaveBeenCalledTimes(1)
  })

  it('disables toggle button when toggleDisabled is true', () => {
    render({ ...mockProps, toggleDisabled: true })

    const toggleButton = screen.getByRole('switch')
    expect(toggleButton).toBeDisabled()
  })
})
