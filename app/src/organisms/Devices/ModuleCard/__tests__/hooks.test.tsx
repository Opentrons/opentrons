import * as React from 'react'
import { act } from 'react-test-renderer'
import { Provider } from 'react-redux'
import { when } from 'jest-when'
import { createStore } from 'redux'
import { I18nextProvider } from 'react-i18next'
import { renderHook } from '@testing-library/react-hooks'
import { i18n } from '../../../../i18n'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { ModuleModel, ModuleType } from '@opentrons/shared-data'
import heaterShakerCommands from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommands.json'
import { getProtocolModulesInfo } from '../../../ProtocolSetup/utils/getProtocolModulesInfo'
import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
import { useProtocolDetailsForRun } from '../../hooks'
import {
  useLatchCommand,
  useModuleOverflowMenu,
  useHeaterShakerFromProtocol,
} from '../hooks'

import {
  mockHeaterShaker,
  mockMagneticModuleGen2,
  mockTemperatureModuleGen2,
  mockThermocycler,
} from '../../../../redux/modules/__fixtures__'

import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../ProtocolSetup/utils/getProtocolModulesInfo')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../../hooks')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>

const mockCloseLatchHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1, hub: null },
} as any

const mockHeatHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_open',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'heating',
  },
  usbPort: { hub: 1, port: 1, path: '/dev/ot_module_heatershaker0' },
} as any

const mockDeactivateShakeHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_open',
    speedStatus: 'speeding up',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { hub: 1, port: 1 },
} as any

const mockMagDeckEngaged = {
  id: 'magdeck_id',
  moduleType: 'magneticModuleType',
  moduleModel: 'magneticModuleV1',
  serialNumber: 'def456',
  hardwareRevision: 'mag_deck_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
    status: 'engaged',
  },
  usbPort: { hub: 1, port: 1, path: '/dev/ot_module_heatershaker0' },
} as any

const mockTemperatureModuleHeating = {
  id: 'tempdeck_id',
  moduleModel: 'temperatureModuleV2',
  moduleType: 'temperatureModuleType',
  serialNumber: 'abc123',
  hardwareRevision: 'temp_deck_v20.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    currentTemperature: 25,
    targetTemperature: null,
    status: 'heating',
  },
  usbPort: { hub: 1, port: 1, path: '/dev/ot_module_tempdeck0' },
} as any

const mockTCBlockHeating = {
  id: 'thermocycler_id',
  moduleModel: 'thermocyclerModuleV1',
  moduleType: 'thermocyclerModuleType',
  serialNumber: 'ghi789',
  hardwareRevision: 'thermocycler_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    lid: 'open',
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
    status: 'heating',
  },
  usbPort: { hub: 1, port: 1, path: '/dev/ot_module_thermocycler0' },
} as any

const mockTCLidHeating = {
  id: 'thermocycler_id',
  moduleModel: 'thermocyclerModuleV1',
  moduleType: 'thermocyclerModuleType',
  serialNumber: 'ghi789',
  hardwareRevision: 'thermocycler_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    lid: 'open',
    lidTargetTemperature: 50,
    lidTemperature: 40,
    currentTemperature: null,
    targetTemperature: null,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
    status: 'heating',
  },
  usbPort: { hub: 1, port: 1, path: '/dev/ot_module_thermocycler0' },
} as any

describe('useLatchCommand', () => {
  const store: Store<any> = createStore(jest.fn(), {})
  let mockCreateLiveCommand = jest.fn()

  beforeEach(() => {
    store.dispatch = jest.fn()
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return latch is open and handle latch function and command to close latch', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(() => useLatchCommand(mockHeaterShaker), {
      wrapper,
    })
    const { isLatchClosed } = result.current

    expect(isLatchClosed).toBe(false)
    act(() => result.current.toggleLatch())
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/closeLabwareLatch',
        params: {
          moduleId: mockHeaterShaker.id,
        },
      },
    })
  })
  it('should return if latch is close and handle latch function to open latch', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () => useLatchCommand(mockCloseLatchHeaterShaker),
      {
        wrapper,
      }
    )
    const { isLatchClosed } = result.current

    expect(isLatchClosed).toBe(true)
    act(() => result.current.toggleLatch())
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/openLabwareLatch',
        params: {
          moduleId: mockCloseLatchHeaterShaker.id,
        },
      },
    })
  })
})

describe('useModuleOverflowMenu', () => {
  const store: Store<any> = createStore(jest.fn(), {})
  let mockCreateLiveCommand = jest.fn()

  beforeEach(() => {
    store.dispatch = jest.fn()
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should return everything for menuItemsByModuleType and create deactive heater command', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () =>
        useModuleOverflowMenu(
          mockHeatHeaterShaker,
          jest.fn(),
          jest.fn(),
          jest.fn(),
          jest.fn()
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const heaterShakerMenu =
      menuOverflowItemsByModuleType.heaterShakerModuleType

    act(() => heaterShakerMenu[0].onClick(false))
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/deactivateHeater',
        params: {
          moduleId: mockHeatHeaterShaker.id,
        },
      },
    })
  })
  it('should render heater shaker module and create deactive shaker command', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () =>
        useModuleOverflowMenu(
          mockDeactivateShakeHeaterShaker,
          jest.fn(),
          jest.fn(),
          jest.fn(),
          jest.fn()
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const heaterShakerMenu =
      menuOverflowItemsByModuleType.heaterShakerModuleType
    act(() => heaterShakerMenu[1].onClick(true))
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/deactivateShaker',
        params: {
          moduleId: mockDeactivateShakeHeaterShaker.id,
        },
      },
    })
  })
  it('should render heater shaker module and calls handleClick when module is idle and calls other handles when button is selected', () => {
    const mockHandleSlideoutClick = jest.fn()
    const mockAboutClick = jest.fn()
    const mockTestShakeClick = jest.fn()
    const mockHandleWizard = jest.fn()
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () =>
        useModuleOverflowMenu(
          mockHeaterShaker,
          mockAboutClick,
          mockTestShakeClick,
          mockHandleWizard,
          mockHandleSlideoutClick
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const heaterShakerMenu =
      menuOverflowItemsByModuleType.heaterShakerModuleType

    act(() => heaterShakerMenu[1].onClick(true))
    expect(mockHandleSlideoutClick).toHaveBeenCalled()
  })

  it('should return only 1 menu button when module is a magnetic module and calls handleClick when module is disengaged', () => {
    const mockHandleClick = jest.fn()
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () =>
        useModuleOverflowMenu(
          mockMagneticModuleGen2,
          jest.fn(),
          jest.fn(),
          jest.fn(),
          mockHandleClick
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const magMenu = menuOverflowItemsByModuleType.magneticModuleType

    act(() => magMenu[0].onClick(false))
    expect(mockHandleClick).toHaveBeenCalled()
  })

  it('should render magnetic module and create disengage command', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () =>
        useModuleOverflowMenu(
          mockMagDeckEngaged,
          jest.fn(),
          jest.fn(),
          jest.fn(),
          jest.fn()
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const magMenu = menuOverflowItemsByModuleType.magneticModuleType

    act(() => magMenu[0].onClick(false))
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'magneticModule/disengageMagnet',
        params: {
          moduleId: mockMagDeckEngaged.id,
        },
      },
    })
  })

  it('should render temperature module and call handleClick when module is idle', () => {
    const mockHandleClick = jest.fn()
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () =>
        useModuleOverflowMenu(
          mockTemperatureModuleGen2,
          jest.fn(),
          jest.fn(),
          jest.fn(),
          mockHandleClick
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const tempMenu = menuOverflowItemsByModuleType.temperatureModuleType
    act(() => tempMenu[0].onClick(false))
    expect(mockHandleClick).toHaveBeenCalled()
  })

  it('should render temp module and create deactivate temp command', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () =>
        useModuleOverflowMenu(
          mockTemperatureModuleHeating,
          jest.fn(),
          jest.fn(),
          jest.fn(),
          jest.fn()
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const tempMenu = menuOverflowItemsByModuleType.temperatureModuleType
    act(() => tempMenu[0].onClick(false))
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'temperatureModule/deactivate',
        params: {
          moduleId: mockTemperatureModuleHeating.id,
        },
      },
    })
  })

  it('should render TC module and call handleClick when module is idle', () => {
    const mockHandleClick = jest.fn()
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () =>
        useModuleOverflowMenu(
          mockThermocycler,
          jest.fn(),
          jest.fn(),
          jest.fn(),
          mockHandleClick
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const tcMenu = menuOverflowItemsByModuleType.thermocyclerModuleType
    act(() => tcMenu[0].onClick(false))
    expect(mockHandleClick).toHaveBeenCalled()
  })

  it('should render TC module and create deactivate temp command', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () =>
        useModuleOverflowMenu(
          mockTCBlockHeating,
          jest.fn(),
          jest.fn(),
          jest.fn(),
          jest.fn()
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const tcMenu = menuOverflowItemsByModuleType.thermocyclerModuleType
    act(() => tcMenu[1].onClick(false))

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'thermocycler/deactivateBlock',
        params: {
          moduleId: mockTCBlockHeating.id,
        },
      },
    })
  })

  it('should render TC module and create deactivate lid command', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )
    const { result } = renderHook(
      () =>
        useModuleOverflowMenu(
          mockTCLidHeating,
          jest.fn(),
          jest.fn(),
          jest.fn(),
          jest.fn()
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const tcMenu = menuOverflowItemsByModuleType.thermocyclerModuleType
    act(() => tcMenu[0].onClick(true))

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'thermocycler/deactivateLid',
        params: {
          moduleId: mockTCLidHeating.id,
        },
      },
    })
  })
})

const mockHeaterShakerDefinition = {
  moduleId: 'someHeaterShakerModule',
  model: 'heaterShakerModuleV1' as ModuleModel,
  type: 'heaterShakerModuleType' as ModuleType,
  displayName: 'Heater Shaker Module',
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

const HEATER_SHAKER_MODULE_INFO = {
  moduleId: 'heaterShakerModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockHeaterShakerDefinition as any,
  nestedLabwareDef: null,
  nestedLabwareId: null,
  nestedLabwareDisplayName: null,
  protocolLoadOrder: 0,
  slotName: '1',
}

describe('useProtocolMetadata', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  beforeEach(() => {
    when(mockUseCurrentRunId).calledWith().mockReturnValue('1')
    store.dispatch = jest.fn()
    mockGetProtocolModulesInfo.mockReturnValue([HEATER_SHAKER_MODULE_INFO])

    when(mockUseProtocolDetailsForRun)
      .calledWith('1')
      .mockReturnValue({
        protocolData: heaterShakerCommands,
      } as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return heater shaker slot number', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(useHeaterShakerFromProtocol, { wrapper })
    const heaterShaker = result.current

    expect(heaterShaker?.slotName).toBe('1')
  })

  it('should return undefined when heater shaker isnt in protocol', () => {
    mockGetProtocolModulesInfo.mockReturnValue([])

    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(useHeaterShakerFromProtocol, { wrapper })
    const heaterShaker = result.current

    expect(heaterShaker?.slotName).toBe(undefined)
  })
})
