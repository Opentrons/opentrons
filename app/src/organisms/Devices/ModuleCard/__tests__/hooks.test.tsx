import * as React from 'react'
import { act } from 'react-test-renderer'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { renderHook } from '@testing-library/react-hooks'
import { i18n } from '../../../../i18n'
import { createStore } from 'redux'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { useLatchCommand, useModuleOverflowMenu } from '../hooks'

import {
  mockHeaterShaker,
  mockMagneticModuleGen2,
  mockTemperatureModuleGen2,
  mockThermocycler,
} from '../../../../redux/modules/__fixtures__'

import type { Store } from 'redux'

jest.mock('@opentrons/react-api-client')

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const mockCloseLatchHeaterShaker = {
  model: 'heaterShakerModuleV1',
  type: 'heaterShakerModuleType',
  port: '/dev/ot_module_thermocycler0',
  serial: 'jkl123',
  revision: 'heatershaker_v4.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemp: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
  },
  usbPort: { hub: 1, port: 1 },
} as any

const mockHeatHeaterShaker = {
  id: 'heaterShaker_id',
  model: 'heaterShakerModuleV1',
  type: 'heaterShakerModuleType',
  port: '/dev/ot_module_thermocycler0',
  serial: 'jkl123',
  revision: 'heatershaker_v4.0',
  fwVersion: 'v2.0.0',
  status: 'heating',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_open',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemp: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
  },
  usbPort: { hub: 1, port: 1 },
} as any

const mockDeactivateShakeHeaterShaker = {
  id: 'heaterShaker_id',
  model: 'heaterShakerModuleV1',
  type: 'heaterShakerModuleType',
  port: '/dev/ot_module_thermocycler0',
  serial: 'jkl123',
  revision: 'heatershaker_v4.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_open',
    speedStatus: 'speeding up',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemp: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
  },
  usbPort: { hub: 1, port: 1 },
} as any

const mockMagDeckEngaged = {
  id: 'magdeck_id',
  model: 'magneticModuleV1',
  type: 'magneticModuleType',
  port: '/dev/ot_module_magdeck0',
  serial: 'def456',
  revision: 'mag_deck_v4.0',
  fwVersion: 'v2.0.0',
  status: 'engaged',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
  },
  usbPort: { hub: 1, port: 1 },
} as any

const mockTemperatureModuleHeating = {
  id: 'tempdeck_id',
  model: 'temperatureModuleV2',
  type: 'temperatureModuleType',
  port: '/dev/ot_module_tempdeck0',
  serial: 'abc123',
  revision: 'temp_deck_v20.0',
  fwVersion: 'v2.0.0',
  status: 'heating',
  hasAvailableUpdate: true,
  data: {
    currentTemp: 25,
    targetTemp: null,
  },
  usbPort: { hub: 1, port: 1 },
} as any

const mockTCBlockHeating = {
  id: 'thermocycler_id',
  model: 'thermocyclerModuleV1',
  type: 'thermocyclerModuleType',
  port: '/dev/ot_module_thermocycler0',
  serial: 'ghi789',
  revision: 'thermocycler_v4.0',
  fwVersion: 'v2.0.0',
  status: 'heating',
  hasAvailableUpdate: true,
  data: {
    lid: 'open',
    lidTarget: null,
    lidTemp: null,
    currentTemp: null,
    targetTemp: null,
    holdTime: null,
    rampRate: null,
    currentCycleIndex: null,
    totalCycleCount: null,
    currentStepIndex: null,
    totalStepCount: null,
  },
  usbPort: { hub: 1, port: 1 },
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

  it('should return latch is open and handle latch function and command to close latch ', () => {
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
    act(() => result.current.handleLatch())
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShakerModule/closeLatch',
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
    act(() => result.current.handleLatch())
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShakerModule/openLatch',
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
        commandType: 'heaterShakerModule/deactivateHeater',
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
        commandType: 'heaterShakerModule/stopShake',
        params: {
          moduleId: mockDeactivateShakeHeaterShaker.id,
        },
      },
    })
  })
  it('should render heater shaker module and calls handleClick when module is idle and calls other handles when button is selected', () => {
    const mockHandleClick = jest.fn()
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
          mockHandleClick
        ),
      {
        wrapper,
      }
    )
    const { menuOverflowItemsByModuleType } = result.current
    const heaterShakerMenu =
      menuOverflowItemsByModuleType.heaterShakerModuleType

    act(() => heaterShakerMenu[1].onClick(true))
    expect(mockHandleClick).toHaveBeenCalled()
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
})
