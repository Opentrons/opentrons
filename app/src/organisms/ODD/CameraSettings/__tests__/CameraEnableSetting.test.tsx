import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { CameraEnableSetting } from '../CameraEnableSetting'

import type { CameraEnableSettingProps } from '../CameraEnableSetting'

const render = (props: CameraEnableSettingProps) => {
  return renderWithProviders(<CameraEnableSetting {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CameraEnableSetting', () => {
  let mockProps: CameraEnableSettingProps

  beforeEach(() => {
    mockProps = {
      isCameraEnabled: true,
      toggleCameraEnabled: vi.fn(),
    }
  })

  it('renders camera header text', () => {
    render(mockProps)

    screen.getByText('Camera')
  })

  it('renders enabled text when camera is enabled', () => {
    render(mockProps)

    screen.getByText('Enabled')
  })

  it('renders disabled text when camera is disabled', () => {
    const propsWithCameraDisabled = {
      ...mockProps,
      isCameraEnabled: false,
    }
    render(propsWithCameraDisabled)

    screen.getByText('Disabled')
  })

  it('calls toggleCameraEnabled when button is clicked', () => {
    render(mockProps)

    const listButton = screen.getByText('Camera')
    fireEvent.click(listButton)

    expect(mockProps.toggleCameraEnabled).toHaveBeenCalledTimes(1)
  })
})
