import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import { AttachAdapter } from '../AttachAdapter'
import { useLatchControls } from '../../../ModuleCard/hooks'
import type { HeaterShakerModule } from '../../../../redux/modules/types'

jest.mock('../../../ModuleCard/hooks')

const mockUseLatchControls = useLatchControls as jest.MockedFunction<
  typeof useLatchControls
>

const render = (props: React.ComponentProps<typeof AttachAdapter>) => {
  return renderWithProviders(<AttachAdapter {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockHeaterShakeShaking: HeaterShakerModule = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'speeding up',
    temperatureStatus: 'idle',
    currentSpeed: 300,
    currentTemperature: null,
    targetSpeed: 800,
    targetTemperature: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: {
    path: '/dev/ot_module_heatershaker0',
    port: 1,
    hub: false,
    portGroup: 'unknown',
  },
}

describe('AttachAdapter', () => {
  let props: React.ComponentProps<typeof AttachAdapter>
  const mockToggleLatch = jest.fn()
  beforeEach(() => {
    props = {
      module: mockHeaterShaker,
    }
    mockUseLatchControls.mockReturnValue({
      toggleLatch: mockToggleLatch,
      isLatchClosed: true,
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders all the Attach adapter component text and images', () => {
    const { getByText, getByAltText, getByLabelText } = render(props)

    getByText('Step 3 of 4: Attach Thermal Adapter')
    getByText('Attach your adapter to the module.')
    getByText('Please use T10 Torx Screwdriver and provided screw')
    getByText(
      'Using a different screwdriver can strip the screws. Using a different screw than the one provided can damage the module'
    )
    getByText('Check alignment.')
    getByText('A properly attached adapter will sit evenly on the module.')
    getByText('3a')
    getByText('Check attachment by rocking the adapter back and forth.')
    getByText('3b')
    getByText('3c')
    getByAltText('heater_shaker_adapter_alignment')
    getByAltText('screw_in_adapter')
    getByLabelText('information')
  })
  it('renders button and clicking on it sends latch command to open', () => {
    const { getByRole } = render(props)
    const btn = getByRole('button', { name: 'Open Labware Latch' })
    fireEvent.click(btn)
    expect(mockToggleLatch).toHaveBeenCalled()
  })
  it('renders button and clicking on it sends latch command to close', () => {
    mockUseLatchControls.mockReturnValue({
      toggleLatch: mockToggleLatch,
      isLatchClosed: false,
    })
    const { getByRole } = render(props)
    const btn = getByRole('button', { name: 'Close Labware Latch' })
    fireEvent.click(btn)
    expect(mockToggleLatch).toHaveBeenCalled()
  })
  it('renders button and it is disabled when heater-shaker is shaking', () => {
    props = {
      module: mockHeaterShakeShaking,
    }
    const { getByRole } = render(props)
    const btn = getByRole('button', { name: 'Open Labware Latch' })
    expect(btn).toBeDisabled()
  })
})
