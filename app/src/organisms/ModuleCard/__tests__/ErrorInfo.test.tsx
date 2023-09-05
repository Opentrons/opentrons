import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ErrorInfo } from '../ErrorInfo'
import {
  mockHeaterShaker,
  mockTemperatureModule,
  mockThermocycler,
} from '../../../redux/modules/__fixtures__'
import type {
  HeaterShakerModule,
  ThermocyclerModule,
} from '../../../redux/modules/types'

const mockErrorThermocycler = {
  id: 'thermocycler_id',
  moduleModel: 'thermocyclerModuleV1',
  moduleType: 'thermocyclerModuleType',
  serialNumber: 'ghi789',
  hardwareRevision: 'thermocycler_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    lidStatus: 'open',
    lidTargetTemperature: null,
    lidTemperature: null,
    currentTemperature: null,
    targetTemperature: null,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
    status: 'error',
  },
  usbPort: {
    path: '/dev/ot_module_thermocycler0',
    port: 1,
    hub: false,
    portGroup: 'unknown',
  },
} as ThermocyclerModule

const mockErrorHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: false,
  data: {
    labwareLatchStatus: 'idle_open',
    speedStatus: 'idle',
    temperatureStatus: 'heating',
    currentSpeed: null,
    currentTemperature: 50,
    targetSpeed: null,
    targetTemperature: 60,
    errorDetails: 'errorDetails',
    status: 'error',
  },
  usbPort: {
    path: '/dev/ot_module_heatershaker0',
    hub: false,
    port: 1,
    portGroup: 'unknown',
  },
} as HeaterShakerModule

const render = (props: React.ComponentProps<typeof ErrorInfo>) => {
  return renderWithProviders(<ErrorInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ErrorInfo', () => {
  let props: React.ComponentProps<typeof ErrorInfo>
  beforeEach(() => {
    props = {
      attachedModule: mockTemperatureModule,
    }
  })

  it('returns null if attachedModule is not a TC or HS', () => {
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })

  it('returns null if attachedModule is a HS is not in error', () => {
    props = {
      attachedModule: mockHeaterShaker,
    }
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })

  it('returns null if attachedModule is a TC is not in error', () => {
    props = {
      attachedModule: mockThermocycler,
    }
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })

  it('returns correct info for a HS in error', () => {
    props = {
      attachedModule: mockErrorHeaterShaker,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Module error')
    const btn = getByLabelText('view_error_details')
    getByText('View')
    getByText('error details')
    fireEvent.click(btn)
    getByText('Heater-Shaker Module GEN1 error')
    getByText('errorDetails')
    getByText(
      'Try powering the module off and on again. If the error persists, contact Opentrons Support.'
    )
    const close = getByRole('button', { name: 'close' })
    fireEvent.click(close)
    expect(screen.queryByText('Heater-Shaker Module GEN1 error')).toBeNull()
  })

  it('returns correct info for a TC in error', () => {
    props = {
      attachedModule: mockErrorThermocycler,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Module error')
    const btn = getByLabelText('view_error_details')
    getByText('View')
    getByText('error details')
    fireEvent.click(btn)
    getByText('Thermocycler Module GEN1 error')
    getByText(
      'Try powering the module off and on again. If the error persists, contact Opentrons Support.'
    )
    const close = getByRole('button', { name: 'close' })
    fireEvent.click(close)
    expect(screen.queryByText('Thermocycler Module GEN1 error')).toBeNull()
  })
})
