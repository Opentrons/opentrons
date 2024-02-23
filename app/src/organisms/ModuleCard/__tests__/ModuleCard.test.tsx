import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'
import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import {
  DispatchApiRequestType,
  useDispatchApiRequest,
} from '../../../redux/robot-api'
import { useCurrentRunStatus } from '../../RunTimeControl/hooks'
import * as RobotApi from '../../../redux/robot-api'
import { useToaster } from '../../ToasterOven'
import { useIsFlex } from '../../Devices/hooks'
import { MagneticModuleData } from '../MagneticModuleData'
import { TemperatureModuleData } from '../TemperatureModuleData'
import { ThermocyclerModuleData } from '../ThermocyclerModuleData'
import { HeaterShakerModuleData } from '../HeaterShakerModuleData'
import { ModuleOverflowMenu } from '../ModuleOverflowMenu'
import { FirmwareUpdateFailedModal } from '../FirmwareUpdateFailedModal'
import { getIsHeaterShakerAttached } from '../../../redux/config'
import { ErrorInfo } from '../ErrorInfo'
import {
  mockMagneticModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockHeaterShaker,
} from '../../../redux/modules/__fixtures__'
import { mockRobot } from '../../../redux/robot-api/__fixtures__'
import { useIsEstopNotDisengaged } from '../../../resources/devices/hooks/useIsEstopNotDisengaged'
import { ModuleCard } from '..'

import type {
  HeaterShakerModule,
  MagneticModule,
  ThermocyclerModule,
} from '../../../redux/modules/types'

jest.mock('../ErrorInfo')
jest.mock('../MagneticModuleData')
jest.mock('../TemperatureModuleData')
jest.mock('../ThermocyclerModuleData')
jest.mock('../HeaterShakerModuleData')
jest.mock('../../../redux/config')
jest.mock('../ModuleOverflowMenu')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../FirmwareUpdateFailedModal')
jest.mock('../../../redux/robot-api')
jest.mock('../../../organisms/ToasterOven')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: jest.fn() } as any),
  }
})
jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../resources/devices/hooks/useIsEstopNotDisengaged')

const mockMagneticModuleData = MagneticModuleData as jest.MockedFunction<
  typeof MagneticModuleData
>
const mockTemperatureModuleData = TemperatureModuleData as jest.MockedFunction<
  typeof TemperatureModuleData
>
const mockModuleOverflowMenu = ModuleOverflowMenu as jest.MockedFunction<
  typeof ModuleOverflowMenu
>
const mockThermocyclerModuleData = ThermocyclerModuleData as jest.MockedFunction<
  typeof ThermocyclerModuleData
>
const mockHeaterShakerModuleData = HeaterShakerModuleData as jest.MockedFunction<
  typeof HeaterShakerModuleData
>
const mockGetIsHeaterShakerAttached = getIsHeaterShakerAttached as jest.MockedFunction<
  typeof getIsHeaterShakerAttached
>
const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>
const mockFirmwareUpdateFailedModal = FirmwareUpdateFailedModal as jest.MockedFunction<
  typeof FirmwareUpdateFailedModal
>
const mockErrorInfo = ErrorInfo as jest.MockedFunction<typeof ErrorInfo>
const mockUseToaster = useToaster as jest.MockedFunction<typeof useToaster>
const mockUseIsEstopNotDisengaged = useIsEstopNotDisengaged as jest.MockedFunction<
  typeof useIsEstopNotDisengaged
>

const mockMagneticModuleHub = {
  id: 'magdeck_id',
  moduleModel: 'magneticModuleV1',
  moduleType: 'magneticModuleType',
  serialNumber: 'def456',
  hardwareRevision: 'mag_deck_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
    status: 'disengaged',
  },
  usbPort: {
    hub: true,
    path: '/dev/ot_module_magdeck0',
    port: 1,
    portGroup: 'unknown',
  },
} as MagneticModule

const mockHotHeaterShaker = {
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
    errorDetails: null,
    status: 'idle',
  },
  usbPort: {
    path: '/dev/ot_module_heatershaker0',
    hub: false,
    port: 1,
    portGroup: 'unknown',
  },
} as HeaterShakerModule

const mockHotThermoGen2 = {
  id: 'thermocycler_id',
  moduleModel: 'thermocyclerModuleV2',
  moduleType: 'thermocyclerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'thermocycler_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: false,
  data: {
    lidStatus: 'open',
    lidTargetTemperature: null,
    lidTemperature: 50,
    currentTemperature: 60,
    targetTemperature: 65,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
    lidTemperatureStatus: 'idle',
    status: 'heating',
  },
  usbPort: {
    path: '/dev/ot_module_thermocycler',
    hub: false,
    port: 1,
    portGroup: 'unknown',
  },
} as ThermocyclerModule

const mockHotThermo = {
  id: 'thermocycler_id',
  moduleModel: 'thermocyclerModuleV1',
  moduleType: 'thermocyclerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'thermocycler_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  moduleOffset: {
    offset: {
      x: 0.1171875,
      y: -0.3046875,
      z: -0.32600000000004314,
    },
    slot: 'D1',
    last_modified: '2023-07-25T14:03:17.692062+00:00',
  },
  data: {
    lidStatus: 'open',
    lidTargetTemperature: null,
    lidTemperature: 50,
    currentTemperature: 60,
    targetTemperature: 65,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
    lidTemperatureStatus: 'idle',
    status: 'heating',
  },
  usbPort: {
    path: '/dev/ot_module_thermocycler',
    hub: false,
    port: 1,
    portGroup: 'unknown',
  },
} as ThermocyclerModule
const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>

const mockMakeSnackbar = jest.fn()
const mockMakeToast = jest.fn()
const mockEatToast = jest.fn()

const render = (props: React.ComponentProps<typeof ModuleCard>) => {
  return renderWithProviders(<ModuleCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ModuleCard', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let props: React.ComponentProps<typeof ModuleCard>

  beforeEach(() => {
    props = {
      module: mockMagneticModule,
      robotName: mockRobot.name,
      isLoadedInRun: false,
      attachPipetteRequired: false,
      calibratePipetteRequired: false,
      updatePipetteFWRequired: false,
    }

    dispatchApiRequest = jest.fn()
    mockErrorInfo.mockReturnValue(null)
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, ['id']])
    mockMagneticModuleData.mockReturnValue(<div>Mock Magnetic Module Data</div>)
    mockThermocyclerModuleData.mockReturnValue(
      <div>Mock Thermocycler Module Data</div>
    )
    mockHeaterShakerModuleData.mockReturnValue(
      <div>Mock Heater Shaker Module Data</div>
    )
    mockModuleOverflowMenu.mockReturnValue(<div>mock module overflow menu</div>)
    mockFirmwareUpdateFailedModal.mockReturnValue(
      <div>mock firmware update failed modal</div>
    )
    mockUseToaster.mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      makeToast: mockMakeToast,
      eatToast: mockEatToast,
    })
    mockGetRequestById.mockReturnValue(null)
    when(mockUseCurrentRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_IDLE)
    when(mockUseIsFlex).calledWith(props.robotName).mockReturnValue(true)
    when(mockUseIsEstopNotDisengaged)
      .calledWith(props.robotName)
      .mockReturnValue(false)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders information for a magnetic module with mocked status', () => {
    render(props)
    screen.getByText('Magnetic Module GEN1')
    screen.getByText('Mock Magnetic Module Data')
    screen.getByText('usb-1')
    screen.getByAltText('magneticModuleV1')
  })
  it('renders information for a temperature module with mocked status', () => {
    mockTemperatureModuleData.mockReturnValue(
      <div>Mock Temperature Module Data</div>
    )

    render({
      ...props,
      module: mockTemperatureModuleGen2,
    })
    screen.getByText('Temperature Module GEN2')
    screen.getByText('Mock Temperature Module Data')
    screen.getByText('usb-1')
    screen.getByAltText('temperatureModuleV2')
  })

  it('renders information for a thermocycler module with mocked status', () => {
    render({
      ...props,
      module: mockThermocycler,
    })

    screen.getByText('Thermocycler Module GEN1')
    screen.getByText('Mock Thermocycler Module Data')
    screen.getByText('usb-1')
    screen.getByAltText('thermocyclerModuleV1')
  })

  it('renders information for a heater shaker module with mocked status', () => {
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
    render({
      ...props,
      module: mockHeaterShaker,
    })

    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Mock Heater Shaker Module Data')
    screen.getByText('usb-1')
    screen.getByAltText('heaterShakerModuleV1')
  })

  it('renders kebab icon, opens and closes overflow menu on click', () => {
    render({
      ...props,
      module: mockMagneticModule,
    })
    const overflowButton = screen.getByRole('button', {
      name: /overflow/i,
    })
    screen.getByText('Magnetic Module GEN1')
    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    const overflowMenu = screen.getByText('mock module overflow menu')
    fireEvent.click(overflowMenu)
    expect(screen.queryByText('mock module overflow menu')).toBeNull()
  })

  it('renders kebab icon and it is disabled when run is in progress', () => {
    when(mockUseCurrentRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_RUNNING)
    render({
      ...props,
      module: mockMagneticModule,
    })
    const overflowButton = screen.getByRole('button', {
      name: /overflow/i,
    })
    screen.getByText('Magnetic Module GEN1')
    expect(overflowButton).toBeDisabled()
  })

  it('renders information for a heater shaker module when it is hot, showing the too hot banner', () => {
    render({
      ...props,
      module: mockHotHeaterShaker,
    })
    screen.getByText(nestedTextMatcher('Module is hot to the touch'))
  })
  it('renders information success toast when update has completed', () => {
    mockGetRequestById.mockReturnValue({
      status: RobotApi.SUCCESS,
      response: {
        method: 'POST',
        ok: true,
        path: '/',
        status: 200,
      },
    })
    render({
      ...props,
      module: mockHotHeaterShaker,
    })
    expect(mockMakeToast).toBeCalled()
  })
  it('renders information when calibration is required so calibration update banner renders', () => {
    render({
      ...props,
      module: mockHotHeaterShaker,
    })
    screen.getByText('Module calibration required.')
  })
  it('does not render calibration update banner for OT-2-specific modules', () => {
    render({
      ...props,
      module: mockMagneticModule,
    })
    expect(
      screen.queryByText('Module calibration required.')
    ).not.toBeInTheDocument()
  })
  it('renders information when a firmware update is available so firmware update banner renders', () => {
    render({
      ...props,
      module: mockHotThermo,
    })
    screen.getByText('Firmware update available.')
    const button = screen.getByText('Update now')
    fireEvent.click(button)
    expect(mockGetRequestById).toHaveBeenCalled()
  })
  it('renders information for update available and it fails rendering the fail modal', () => {
    mockGetRequestById.mockReturnValue({
      status: RobotApi.FAILURE,
      response: {
        method: 'POST',
        ok: false,
        path: '/',
        status: 500,
      },
      error: { message: 'ruh roh' },
    })
    render({
      ...props,
      module: mockHotThermo,
    })
    screen.getByText('Firmware update available.')
    const button = screen.getByText('Update now')
    fireEvent.click(button)
    expect(mockGetRequestById).toHaveBeenCalled()
    expect(screen.getByText('mock firmware update failed modal')).toBeVisible()
  })
  it('renders information for update available and updating now text shows up when update is in progress', () => {
    mockGetRequestById.mockReturnValue({
      status: RobotApi.PENDING,
    })
    render({
      ...props,
      module: mockMagneticModuleHub,
    })
    expect(screen.getByText('Updating firmware...')).toBeVisible()
    expect(screen.getByLabelText('ot-spinner')).toBeVisible()
  })

  it('renders information for a thermocycler module gen 2 when it is hot, showing the too hot banner', () => {
    render({
      ...props,
      module: mockHotThermoGen2,
    })
    screen.getByText(nestedTextMatcher('Module is hot to the touch'))
    screen.getByAltText('thermocyclerModuleV2')
  })

  it('renders information for a thermocycler module gen 1 when it is hot, showing the too hot banner', () => {
    render({
      ...props,
      module: mockHotThermo,
    })
    screen.getByText(nestedTextMatcher('Module is hot to the touch'))
    screen.getByAltText('thermocyclerModuleV1')
  })

  it('renders information for a heater shaker module with an error', () => {
    mockErrorInfo.mockReturnValue(<div>mock heater shaker error</div>)
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
    render({
      ...props,
      module: mockHeaterShaker,
    })

    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Mock Heater Shaker Module Data')
    screen.getByText('mock heater shaker error')
  })
})
