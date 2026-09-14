import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useResetRobotConfigMutation } from '/app/resources/devices/hooks/useResetRobotConfigMutation'

import { DeviceReset } from '../DeviceReset'

import type { ComponentProps } from 'react'

vi.mock('/app/resources/devices/hooks/useResetRobotConfigMutation')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const mockPostResetConfig = vi.fn()

const render = (props: ComponentProps<typeof DeviceReset>) => {
  return renderWithProviders(<DeviceReset {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DeviceReset', () => {
  let props: ComponentProps<typeof DeviceReset>

  beforeEach(() => {
    props = {
      robotName: 'mockRobot',
      setCurrentOption: vi.fn(),
    }
    mockPostResetConfig.mockReset()
    vi.mocked(useResetRobotConfigMutation).mockReturnValue({
      postResetConfig: mockPostResetConfig,
      reset: vi.fn(),
    } as any)
  })

  it('should render text and button', () => {
    render(props)
    screen.getByText('Clear pipette calibration')
    screen.getByText('Clear gripper calibration')
    screen.getByText('Clear module calibration')
    screen.getByText('Clear protocol run history')
    screen.getByText('Clear labware offset data')
    screen.getByText('Clears information about past runs of all protocols.')
    screen.getByText('Clear all stored data')
    screen.getByText(
      'Clears calibrations, protocols, and all settings except robot name and network settings.'
    )
    expect(
      screen.queryByText('authorized') // as in "SSH authorized keys"
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('DeviceReset_clear_data_button')).toBeDisabled()
  })

  it('when tapping a option button, the clear button is enabled', () => {
    render(props)
    fireEvent.click(screen.getByText('Clear pipette calibration'))
    expect(
      screen.getByTestId('DeviceReset_clear_data_button')
    ).not.toBeDisabled()
  })

  it('when tapping a option button and tapping the clear button, a mock function is called', () => {
    const clearMockResetOptions = {
      resetLabwareOffsets: false,
      settingsResets: {
        gripperOffsetCalibrations: false,
        pipetteOffsetCalibrations: true,
        moduleCalibration: true,
        runsHistory: true,
      },
    }
    render(props)
    fireEvent.click(screen.getByText('Clear pipette calibration'))
    fireEvent.click(screen.getByText('Clear protocol run history'))
    fireEvent.click(screen.getByText('Clear module calibration'))
    const clearButton = screen.getByText('Clear data and restart robot')
    fireEvent.click(clearButton)
    screen.getByText('Are you sure you want to reset your device?')
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockPostResetConfig).toBeCalledWith(clearMockResetOptions)
  })

  it('when tapping clear all stored data, all options are active', () => {
    const clearMockResetOptions = {
      resetLabwareOffsets: true,
      settingsResets: {
        pipetteOffsetCalibrations: true,
        moduleCalibration: true,
        runsHistory: true,
        gripperOffsetCalibrations: true,
        authorizedKeys: true,
        onDeviceDisplay: true,
        deckConfiguration: true,
      },
    }

    render(props)
    fireEvent.click(screen.getByText('Clear all stored data'))
    const clearButton = screen.getByText('Clear data and restart robot')
    fireEvent.click(clearButton)
    screen.getByText('Are you sure you want to reset your device?')
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockPostResetConfig).toBeCalledWith(clearMockResetOptions)
  })

  it('when tapping all options except clear all stored data, all options are active', () => {
    const clearMockResetOptions = {
      resetLabwareOffsets: true,
      settingsResets: {
        pipetteOffsetCalibrations: true,
        moduleCalibration: true,
        runsHistory: true,
        gripperOffsetCalibrations: true,
        authorizedKeys: true,
        onDeviceDisplay: true,
        deckConfiguration: true,
      },
    }

    render(props)
    fireEvent.click(screen.getByText('Clear pipette calibration'))
    fireEvent.click(screen.getByText('Clear gripper calibration'))
    fireEvent.click(screen.getByText('Clear module calibration'))
    fireEvent.click(screen.getByText('Clear protocol run history'))
    fireEvent.click(screen.getByText('Clear labware offset data'))
    const clearButton = screen.getByText('Clear data and restart robot')
    fireEvent.click(clearButton)
    screen.getByText('Are you sure you want to reset your device?')
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockPostResetConfig).toBeCalledWith(clearMockResetOptions)
  })

  it('when tapping clear all stored data and unselect one options, all options are not active', () => {
    const clearMockResetOptions = {
      resetLabwareOffsets: true,
      settingsResets: {
        pipetteOffsetCalibrations: false,
        moduleCalibration: true,
        runsHistory: true,
        gripperOffsetCalibrations: true,
      },
    }

    render(props)
    fireEvent.click(screen.getByText('Clear all stored data'))
    fireEvent.click(screen.getByText('Clear pipette calibration'))
    const clearButton = screen.getByText('Clear data and restart robot')
    fireEvent.click(clearButton)
    screen.getByText('Are you sure you want to reset your device?')
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockPostResetConfig).toBeCalledWith(clearMockResetOptions)
  })
})
