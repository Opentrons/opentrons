import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
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
import { MagneticModuleData } from '../MagneticModuleData'
import { TemperatureModuleData } from '../TemperatureModuleData'
import { ThermocyclerModuleData } from '../ThermocyclerModuleData'
import { HeaterShakerModuleData } from '../HeaterShakerModuleData'
import { ModuleOverflowMenu } from '../ModuleOverflowMenu'
import { FirmwareUpdateFailedModal } from '../FirmwareUpdateFailedModal'
import { getIsHeaterShakerAttached } from '../../../redux/config'
import { ErrorInfo } from '../ErrorInfo'
import { ModuleCard } from '..'
import {
  mockMagneticModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockHeaterShaker,
} from '../../../redux/modules/__fixtures__'
import { mockRobot } from '../../../redux/robot-api/__fixtures__'

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

  beforeEach(() => {
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
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders information for a magnetic module with mocked status', () => {
    const { getByText, getByAltText } = render({
      module: mockMagneticModule,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    getByText('Magnetic Module GEN1')
    getByText('Mock Magnetic Module Data')
    getByText('usb-1')
    getByAltText('magneticModuleV1')
  })
  it('renders information for a temperature module with mocked status', () => {
    mockTemperatureModuleData.mockReturnValue(
      <div>Mock Temperature Module Data</div>
    )

    const { getByText, getByAltText } = render({
      module: mockTemperatureModuleGen2,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    getByText('Temperature Module GEN2')
    getByText('Mock Temperature Module Data')
    getByText('usb-1')
    getByAltText('temperatureModuleV2')
  })

  it('renders information for a thermocycler module with mocked status', () => {
    const { getByText, getByAltText } = render({
      module: mockThermocycler,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })

    getByText('Thermocycler Module GEN1')
    getByText('Mock Thermocycler Module Data')
    getByText('usb-1')
    getByAltText('thermocyclerModuleV1')
  })

  it('renders information for a heater shaker module with mocked status', () => {
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
    const { getByText, getByAltText } = render({
      module: mockHeaterShaker,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })

    getByText('Heater-Shaker Module GEN1')
    getByText('Mock Heater Shaker Module Data')
    getByText('usb-1')
    getByAltText('heaterShakerModuleV1')
  })

  it('renders kebab icon, opens and closes overflow menu on click', () => {
    const { getByRole, getByText, queryByText } = render({
      module: mockMagneticModule,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    getByText('Magnetic Module GEN1')
    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
    const overflowMenu = getByText('mock module overflow menu')
    overflowMenu.click()
    expect(queryByText('mock module overflow menu')).toBeNull()
  })

  it('renders kebab icon and it is disabled when run is in progress', () => {
    when(mockUseCurrentRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_RUNNING)
    const { getByRole, getByText } = render({
      module: mockMagneticModule,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    getByText('Magnetic Module GEN1')
    expect(overflowButton).toBeDisabled()
  })

  it('renders information for a heater shaker module when it is hot, showing the too hot banner', () => {
    const { getByText } = render({
      module: mockHotHeaterShaker,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    getByText(nestedTextMatcher('Module is hot to the touch'))
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
      module: mockHotHeaterShaker,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    expect(mockMakeToast).toBeCalled()
  })
  it('renders information for a magnetic module when an update is available so update banner renders', () => {
    const { getByText } = render({
      module: mockMagneticModuleHub,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    getByText('Firmware update available.')
    const button = getByText('Update now')
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
    const { getByText } = render({
      module: mockMagneticModuleHub,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    getByText('Firmware update available.')
    const button = getByText('Update now')
    fireEvent.click(button)
    expect(mockGetRequestById).toHaveBeenCalled()
    expect(getByText('mock firmware update failed modal')).toBeVisible()
  })
  it('renders information for update available and updating now text shows up when update is in progress', () => {
    mockGetRequestById.mockReturnValue({
      status: RobotApi.PENDING,
    })
    const { getByText, getByLabelText } = render({
      module: mockMagneticModuleHub,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    expect(getByText('Updating firmware...')).toBeVisible()
    expect(getByLabelText('ot-spinner')).toBeVisible()
  })

  it('renders information for a thermocycler module gen 2 when it is hot, showing the too hot banner', () => {
    const { getByText, getByAltText } = render({
      module: mockHotThermoGen2,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    getByText(nestedTextMatcher('Module is hot to the touch'))
    getByAltText('thermocyclerModuleV2')
  })

  it('renders information for a thermocycler module gen 1 when it is hot, showing the too hot banner', () => {
    const { getByText, getByAltText } = render({
      module: mockHotThermo,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })
    getByText(nestedTextMatcher('Module is hot to the touch'))
    getByAltText('thermocyclerModuleV1')
  })

  it('renders information for a heater shaker module with an error', () => {
    mockErrorInfo.mockReturnValue(<div>mock heater shaker error</div>)
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
    const { getByText } = render({
      module: mockHeaterShaker,
      robotName: mockRobot.name,
      isLoadedInRun: false,
    })

    getByText('Heater-Shaker Module GEN1')
    getByText('Mock Heater Shaker Module Data')
    getByText('mock heater shaker error')
  })
})
