import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'
import { when } from 'vitest-when'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useIsFlex } from '/app/redux-resources/robots'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'

import { UpdateBanner } from '..'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/devices/hooks/useIsEstopNotDisengaged')

const render = (props: ComponentProps<typeof UpdateBanner>) => {
  return renderWithProviders(<UpdateBanner {...props} />, {
    i18nInstance: i18n,
    initialState: { robotsByName: 'test' },
  })[0]
}

describe('Module Update Banner', () => {
  let props: ComponentProps<typeof UpdateBanner>

  beforeEach(() => {
    props = {
      robotName: 'testRobot',
      updateType: 'calibration',
      handleUpdateClick: vi.fn(),
      serialNumber: 'test_number',
      isTooHot: false,
    }
    when(useIsFlex).calledWith(props.robotName).thenReturn(true)
    when(useIsEstopNotDisengaged).calledWith(props.robotName).thenReturn(false)
  })

  it('enables the updateType and serialNumber to be used as the test ID', () => {
    render(props)
    screen.getByTestId('ModuleCard_calibration_update_banner_test_number')
    screen.getByTestId('InlineNotification_error')
  })

  it('renders an error banner if calibration is required with no exit button', () => {
    render(props) // updateType is 'calibration', canProceed is true by default
    screen.getByTestId('InlineNotification_error')
    expect(screen.queryByLabelText('close_icon')).not.toBeInTheDocument()
    screen.getByText('Module setup required.')
    screen.getByText('Setup module')
  })

  it('renders an alert banner if a module setup is required with no exit button', () => {
    props = {
      ...props,
      updateType: 'setup',
    }
    render(props)
    screen.getByTestId('ModuleCard_setup_update_banner_test_number')
    screen.getByTestId('InlineNotification_alert')
    expect(screen.queryByLabelText('close_icon')).not.toBeInTheDocument()
    screen.getByText('Setup module for use.')
    screen.getByText('Setup module')
  })

  it('renders an alert banner if a module firmware is available with exit button', () => {
    props = {
      ...props,
      updateType: 'firmware',
      handleCloseClick: vi.fn(),
    }
    render(props)
    screen.getByTestId('ModuleCard_firmware_update_banner_test_number')
    screen.getByTestId('InlineNotification_alert')
    screen.queryByLabelText('close_icon')
    screen.getByText('Firmware update available..')
    screen.getByText('Update now')
  })

  it('enables clicking of text to open the appropriate update modal', () => {
    render(props) // updateType is 'calibration'
    screen.getByText('Module setup required.')
    const moduleSetupBtn = screen.getByText('Setup module')
    fireEvent.click(moduleSetupBtn)
    expect(props.handleUpdateClick).toHaveBeenCalled()

    props = {
      ...props,
      updateType: 'setup',
    }
    render(props) // Re-render with new props
    screen.getByText('Setup module for use.')
    fireEvent.click(moduleSetupBtn)
    expect(props.handleUpdateClick).toHaveBeenCalledTimes(2)
  })

  it('should not render a module setup link if pipette attachment is required', () => {
    props = {
      ...props,
      updateType: 'calibration',
      attachPipetteRequired: true,
    }
    render(props)
    screen.getByText(
      'Module setup required. Attach a pipette before running module setup.'
    )
    expect(screen.queryByText('Setup module')).not.toBeInTheDocument()
  })

  it('should not render a module setup link if pipette calibration is required', () => {
    props = {
      ...props,
      updateType: 'calibration',
      calibratePipetteRequired: true,
    }
    render(props)
    screen.getByText(
      'Module setup required. Calibrate pipette before running module setup.'
    )
    expect(screen.queryByText('Setup module')).not.toBeInTheDocument()
  })

  it('should render module setup banner even if pipette calibration is required', () => {
    props = {
      ...props,
      updateType: 'setup',
      calibratePipetteRequired: true,
    }
    render(props)
    expect(
      screen.queryByLabelText(
        'ModuleCard_calibration_update_banner_test_number'
      )
    ).not.toBeInTheDocument()
    screen.getByText('Setup module')
  })

  it('should not render a module setup link if pipette firmware update is required', () => {
    props = {
      ...props,
      updateType: 'calibration',
      updatePipetteFWRequired: true,
    }
    render(props)
    screen.getByText(
      'Update pipette firmware before proceeding with required module setup.'
    )
    expect(screen.queryByText('Setup module')).not.toBeInTheDocument()
  })

  it('should not render a module setup link when e-stop is pressed ', () => {
    when(useIsEstopNotDisengaged).calledWith(props.robotName).thenReturn(true)
    render(props)
    expect(screen.queryByText('Setup module')).not.toBeInTheDocument()
  })

  it('should not render a module setup link if the robot is an OT-2', () => {
    when(useIsFlex).calledWith(props.robotName).thenReturn(false)
    render(props)
    expect(screen.queryByText('Setup module')).not.toBeInTheDocument()
  })
})
