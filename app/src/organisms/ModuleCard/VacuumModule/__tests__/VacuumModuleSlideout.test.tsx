import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { useVacuumModuleControls } from '../hooks/useVacuumModuleControls'
import { VacuumModuleSlideout } from '../VacuumModuleSlideout'

import type { ComponentProps } from 'react'
import type { VacuumModule } from '@opentrons/api-client'

vi.mock('../hooks/useVacuumModuleControls')

const mockVacuumModule: VacuumModule = {
  id: 'vacuum_id',
  moduleModel: 'vacuumModuleV1',
  moduleType: 'vacuumModuleType',
  serialNumber: 'vac123',
  hardwareRevision: 'vacuum_v1.0',
  firmwareVersion: 'v1.0.0',
  hasAvailableUpdate: false,
  data: {
    currentPressure: null,
    targetPressure: null,
    currentPower: null,
    targetPower: null,
    ventStatus: 'closed',
    modeType: 'pressure',
    status: 'idle',
  },
  usbPort: {
    path: '/dev/ot_module_vacuum0',
    port: 1,
    hub: false,
    portGroup: 'unknown',
  },
}

const render = (props: ComponentProps<typeof VacuumModuleSlideout>) => {
  return renderWithProviders(<VacuumModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('VacuumModuleSlideout', () => {
  let props: ComponentProps<typeof VacuumModuleSlideout>
  const mockOnCloseClick = vi.fn()
  const mockSetVacuumPressure = vi.fn()
  const mockSetVacuumPower = vi.fn()

  beforeEach(() => {
    props = {
      module: mockVacuumModule,
      isExpanded: true,
      onCloseClick: mockOnCloseClick,
    }
    vi.mocked(useVacuumModuleControls).mockReturnValue({
      setVacuumPressure: mockSetVacuumPressure,
      setVacuumPower: mockSetVacuumPower,
      deactivateVacuum: vi.fn(),
      openVent: vi.fn(),
      closeVent: vi.fn(),
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders correct title for vacuum module', () => {
    render(props)

    expect(
      screen.getByText('Set Vacuum for Vacuum Module GEN1')
    ).toBeInTheDocument()
  })

  it('renders mode type selection with pressure and power options', () => {
    render(props)

    expect(screen.getByText('Select mode type')).toBeInTheDocument()
    expect(screen.getByLabelText('Pressure')).toBeInTheDocument()
    expect(screen.getByLabelText('Power')).toBeInTheDocument()
  })

  it('renders pressure input when pressure mode is selected', () => {
    render(props)

    const pressureButton = screen.getByLabelText('Pressure')
    fireEvent.click(pressureButton)

    expect(screen.getByText('Gauge pressure')).toBeInTheDocument()
    expect(screen.getByText('Valid range between -800-0')).toBeInTheDocument()
    expect(screen.getByText('mbar')).toBeInTheDocument()
  })

  it('renders power slider when power mode is selected', () => {
    render(props)

    const powerButton = screen.getByLabelText('Power')
    fireEvent.click(powerButton)

    expect(screen.getByText('Pump power')).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('does not render pressure input or power slider initially', () => {
    render(props)

    expect(screen.queryByText('Gauge pressure')).not.toBeInTheDocument()
    expect(screen.queryByText('Pump power')).not.toBeInTheDocument()
  })

  it('switches between pressure and power modes', () => {
    render(props)

    // Select pressure mode
    const pressureButton = screen.getByLabelText('Pressure')
    fireEvent.click(pressureButton)
    expect(screen.getByText('Gauge pressure')).toBeInTheDocument()
    expect(screen.queryByText('Pump power')).not.toBeInTheDocument()

    // Switch to power mode
    const powerButton = screen.getByLabelText('Power')
    fireEvent.click(powerButton)
    expect(screen.queryByText('Gauge pressure')).not.toBeInTheDocument()
    expect(screen.getByText('Pump power')).toBeInTheDocument()
  })

  it('renders confirm button with correct test id', () => {
    render(props)

    screen.getByTestId('VacuumModuleSlideout_btn_vac123')
  })

  it('allows entering pressure value in pressure mode', () => {
    render(props)

    // Select pressure mode
    const pressureButton = screen.getByLabelText('Pressure')
    fireEvent.click(pressureButton)

    screen.getByText('Gauge pressure')
    screen.getByText('Valid range between -800-0')
  })

  it('calls setVacuumPressure with correct value when confirming in pressure mode', () => {
    render(props)

    const pressureButton = screen.getByLabelText('Pressure')
    fireEvent.click(pressureButton)

    const input = screen.getByLabelText('Gauge pressure')
    fireEvent.change(input, { target: { value: '-50' } })

    const confirmButton = screen.getByTestId(
      `VacuumModuleSlideout_btn_${mockVacuumModule.serialNumber}`
    )
    fireEvent.click(confirmButton)

    expect(mockSetVacuumPressure).toHaveBeenCalledWith(-50)
    expect(mockSetVacuumPower).not.toHaveBeenCalled()
    expect(mockOnCloseClick).toHaveBeenCalled()
  })

  it('calls setVacuumPower with correct value when confirming in power mode', () => {
    render(props)

    const powerButton = screen.getByLabelText('Power')
    fireEvent.click(powerButton)

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '75' } })

    const confirmButton = screen.getByTestId(
      `VacuumModuleSlideout_btn_${mockVacuumModule.serialNumber}`
    )
    fireEvent.click(confirmButton)

    expect(mockSetVacuumPower).toHaveBeenCalledWith(75)
    expect(mockSetVacuumPressure).not.toHaveBeenCalled()
    expect(mockOnCloseClick).toHaveBeenCalled()
  })

  it('does not call vacuum methods when no mode is selected', () => {
    render(props)

    const confirmButton = screen.getByTestId(
      `VacuumModuleSlideout_btn_${mockVacuumModule.serialNumber}`
    )
    fireEvent.click(confirmButton)

    expect(mockSetVacuumPressure).not.toHaveBeenCalled()
    expect(mockSetVacuumPower).not.toHaveBeenCalled()
    expect(mockOnCloseClick).not.toHaveBeenCalled()
  })
})
