import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { VacuumModuleSlideout } from '../VacuumModuleSlideout'

import type { ComponentProps } from 'react'
import type { VacuumModule } from '@opentrons/api-client'

const mockVacuumModule: VacuumModule = {
  id: 'vacuum_id',
  moduleModel: 'vacuumModuleMilliporeV1',
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

  beforeEach(() => {
    props = {
      module: mockVacuumModule,
      isExpanded: true,
      onCloseClick: mockOnCloseClick,
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders correct title for vacuum module', () => {
    render(props)

    expect(
      screen.getByText('Set Vacuum for Millipore MultiScreen® Vacuum Manifold')
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
    expect(screen.getByText('Valid range between 0-1000')).toBeInTheDocument()
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

  it('calls onCloseClick when confirm button is clicked', () => {
    render(props)

    const confirmButton = screen.getByTestId(
      `VacuumModuleSlideout_btn_${mockVacuumModule.serialNumber}`
    )
    fireEvent.click(confirmButton)

    expect(mockOnCloseClick).toHaveBeenCalled()
  })

  it('allows entering pressure value in pressure mode', () => {
    render(props)

    // Select pressure mode
    const pressureButton = screen.getByLabelText('Pressure')
    fireEvent.click(pressureButton)

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '500' } })

    expect(input).toHaveValue(500)
  })
})
