import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  mockHeaterShaker,
  mockMagneticModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
} from '@opentrons/api-client'
import {
  useCurrentAllSubsystemUpdatesQuery,
  useUpdateModuleMutation,
} from '@opentrons/react-api-client'

import { nestedTextMatcher, renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useToaster } from '/app/organisms/ToasterOven'
import { useIsFlex } from '/app/redux-resources/robots'
import { getIsHeaterShakerAttached } from '/app/redux/config'
import { getLocalRobot } from '/app/redux/discovery'
import { mockConnectedRobot } from '/app/redux/discovery/__fixtures__'
import { mockRobot } from '/app/redux/robot-api/__fixtures__'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useIsEstopNotDisengaged } from '/app/resources/devices'
import { useRunStatuses } from '/app/resources/runs'

import { ModuleCard } from '..'
import { useIsDoorOpen } from '../../DoorOpenControl/useIsDoorOpen'
import { handleModuleWizardFlows } from '../../ModuleWizardFlows'
import { ErrorInfo } from '../ErrorInfo'
import { FirmwareUpdateFailedModal } from '../FirmwareUpdateFailedModal'
import { FlexStackerModuleData } from '../FlexStackerModuleData'
import { HeaterShakerModuleData } from '../HeaterShakerModuleData'
import { MagneticModuleData } from '../MagneticModuleData'
import { ModuleOverflowMenu } from '../ModuleOverflowMenu'
import { TemperatureModuleData } from '../TemperatureModuleData'
import { ThermocyclerModuleData } from '../ThermocyclerModuleData'
import { VacuumModuleData } from '../VacuumModule/VacuumModuleData'

import type { ComponentProps } from 'react'
import type { UseQueryResult } from 'react-query'
import type {
  FlexStackerModule,
  HeaterShakerModule,
  MagneticModule,
  ThermocyclerModule,
  VacuumModule,
} from '@opentrons/api-client'
import type { DeckConfiguration } from '@opentrons/shared-data'

vi.mock('../ErrorInfo')
vi.mock('../MagneticModuleData')
vi.mock('../TemperatureModuleData')
vi.mock('../ThermocyclerModuleData')
vi.mock('../HeaterShakerModuleData')
vi.mock('../FlexStackerModuleData')
vi.mock('../VacuumModule/VacuumModuleData')
vi.mock('/app/redux/config')
vi.mock('@opentrons/react-api-client')
vi.mock('../ModuleOverflowMenu')
vi.mock('../../ModuleWizardFlows')
vi.mock('/app/resources/runs')
vi.mock('../FirmwareUpdateFailedModal')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/organisms/ToasterOven')
vi.mock('/app/resources/devices/hooks/useIsEstopNotDisengaged')
vi.mock('/app/resources/deck_configuration')
vi.mock('../../DoorOpenControl/useIsDoorOpen')
vi.mock('/app/redux/discovery')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

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

const mockFlexStacker = {
  id: 'flex_stacker_id',
  serialNumber: 'fs123',
  hardwareRevision: 'flex_stacker_v1.0',
  moduleModel: 'flexStackerModuleV1',
  moduleType: 'flexStackerModuleType',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: false,
  usbPort: {
    path: '/dev/ot_module_flex_stacker',
    hub: false,
    port: 1,
    hubPort: 1,
    portGroup: 'unknown',
  },
  data: {
    platformState: 'extended',
    hopperDoorState: 'closed',
    status: 'idle',
  },
} as FlexStackerModule

const mockVacuumModule = {
  id: 'vacuum_module_id',
  serialNumber: 'vm123',
  hardwareRevision: 'vacuum_module_v1.0',
  moduleModel: 'vacuumModuleV1',
  moduleType: 'vacuumModuleType',
  firmwareVersion: 'v1.0.0',
  hasAvailableUpdate: false,
  usbPort: {
    path: '/dev/ot_module_vacuum',
    hub: false,
    port: 1,
    hubPort: 1,
    portGroup: 'unknown',
  },
  data: {
    currentPressure: null,
    targetPressure: null,
    currentPower: null,
    targetPower: null,
    modeType: 'pressure',
    ventStatus: 'closed',
    status: 'idle',
  },
} as VacuumModule

const mockMakeSnackbar = vi.fn()
const mockMakeToast = vi.fn()
const mockEatToast = vi.fn()
const mockUpdateModuleAsync = vi.fn()
const mockResetUpdateModule = vi.fn()

const render = (props: ComponentProps<typeof ModuleCard>) => {
  return renderWithProviders(<ModuleCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockUpdateModuleMutation = (
  overrides: Record<string, unknown> = {}
): void => {
  vi.mocked(useUpdateModuleMutation).mockReturnValue({
    mutateAsync: mockUpdateModuleAsync,
    isLoading: false,
    isError: false,
    error: null,
    reset: mockResetUpdateModule,
    ...overrides,
  } as any)
}

describe('ModuleCard', () => {
  let props: ComponentProps<typeof ModuleCard>

  beforeEach(() => {
    props = {
      module: mockMagneticModule,
      robotName: mockRobot.name,
      isLoadedInRun: false,
      attachPipetteRequired: false,
      calibratePipetteRequired: false,
      updatePipetteFWRequired: false,
    }

    vi.mocked(ErrorInfo).mockReturnValue(null)
    vi.mocked(MagneticModuleData).mockReturnValue(
      <div>Mock Magnetic Module Data</div>
    )
    vi.mocked(ThermocyclerModuleData).mockReturnValue(
      <div>Mock Thermocycler Module Data</div>
    )
    vi.mocked(HeaterShakerModuleData).mockReturnValue(
      <div>Mock Heater Shaker Module Data</div>
    )
    vi.mocked(FlexStackerModuleData).mockReturnValue(
      <div>Mock Flex Stacker Module Data</div>
    )
    vi.mocked(VacuumModuleData).mockReturnValue(
      <div>Mock Vacuum Module Data</div>
    )
    vi.mocked(ModuleOverflowMenu).mockReturnValue(
      <div>mock module overflow menu</div>
    )
    vi.mocked(FirmwareUpdateFailedModal).mockReturnValue(
      <div>mock firmware update failed modal</div>
    )
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      makeToast: mockMakeToast,
      eatToast: mockEatToast,
    })
    mockUpdateModuleAsync.mockResolvedValue({})
    mockUpdateModuleMutation()
    when(useRunStatuses)
      .calledWith()
      .thenReturn({ isRunRunning: false } as any)
    when(useIsFlex).calledWith(props.robotName).thenReturn(true)
    when(useIsEstopNotDisengaged).calledWith(props.robotName).thenReturn(false)
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [],
    } as unknown as UseQueryResult<DeckConfiguration>)
    vi.mocked(getLocalRobot).mockReturnValue({
      ...mockConnectedRobot,
      name: props.robotName,
    })
    vi.mocked(useIsDoorOpen).mockReturnValue({
      isDoorOpen: true,
      moduleDoorLocation: null,
    })
    vi.mocked(useCurrentAllSubsystemUpdatesQuery).mockReturnValue({
      data: { data: [] },
    } as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders information for a magnetic module with mocked status', () => {
    render(props)
    screen.getByText('Magnetic Module GEN1')
    screen.getByText('Mock Magnetic Module Data')
    screen.getByText('USB-1')
    screen.getByAltText('magneticModuleV1')
  })
  it('renders information for a temperature module with mocked status', () => {
    vi.mocked(TemperatureModuleData).mockReturnValue(
      <div>Mock Temperature Module Data</div>
    )

    render({
      ...props,
      module: mockTemperatureModuleGen2,
    })
    screen.getByText('Temperature Module GEN2')
    screen.getByText('Mock Temperature Module Data')
    screen.getByText('USB-1')
    screen.getByAltText('temperatureModuleV2')
  })

  it('renders information for a thermocycler module with mocked status', () => {
    render({
      ...props,
      module: mockThermocycler,
    })

    screen.getByText('Thermocycler Module GEN1')
    screen.getByText('Mock Thermocycler Module Data')
    screen.getByText('USB-1')
    screen.getByAltText('thermocyclerModuleV1')
  })

  it('renders information for a heater shaker module with mocked status', () => {
    vi.mocked(getIsHeaterShakerAttached).mockReturnValue(true)
    render({
      ...props,
      module: mockHeaterShaker,
    })

    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Mock Heater Shaker Module Data')
    screen.getByText('USB-1')
    screen.getByAltText('heaterShakerModuleV1')
  })

  it('renders information for a heater shaker module with mocked status', () => {
    vi.mocked(getIsHeaterShakerAttached).mockReturnValue(true)
    render({
      ...props,
      module: mockFlexStacker,
    })

    screen.getByText('Flex Stacker Module GEN1')
    screen.getByText('Mock Flex Stacker Module Data')
    screen.getByText('S-1')
    screen.getByAltText('flexStackerModuleV1')
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
    when(useRunStatuses)
      .calledWith()
      .thenReturn({ isRunRunning: true } as any)
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
  it('renders information success toast when update has completed', async () => {
    mockUpdateModuleAsync.mockResolvedValue({})
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [
        {
          cutoutId: 'cutoutB3',
          cutoutFixtureId: 'thermocyclerModuleV1',
          opentronsModuleSerialNumber: 'jkl123',
        },
      ],
    } as unknown as UseQueryResult<DeckConfiguration>)
    render({
      ...props,
      module: mockHotThermo,
    })
    fireEvent.click(screen.getByText('Update now'))
    expect(mockUpdateModuleAsync).toHaveBeenCalledWith(
      mockHotThermo.serialNumber
    )
    await vi.waitFor(() => {
      expect(mockMakeToast).toHaveBeenCalled()
    })
  })
  it('renders information when calibration is required so calibration update banner renders', () => {
    render({
      ...props,
      module: mockHotHeaterShaker,
    })
    screen.getByText('Module setup required.')
  })
  it('does not render calibration update banner for OT-2-specific modules', () => {
    vi.mocked(useIsFlex).mockReturnValue(false)
    render({
      ...props,
      module: mockMagneticModule,
    })
    expect(screen.queryByText('Module setup required.')).not.toBeInTheDocument()
  })
  ;[mockFlexStacker, mockVacuumModule].forEach(module => {
    it('renders module setup link for no-calibration required modules', () => {
      render({
        ...props,
        module,
      })
      screen.getByText('Set up module for use.')
      const button = screen.getByText('Set up module')
      fireEvent.click(button)
      expect(vi.mocked(handleModuleWizardFlows)).toHaveBeenCalled()
    })
  })
  ;[mockFlexStacker, mockVacuumModule].forEach(module => {
    it('renders module setup link for no-calibration required modules if firmware update available', () => {
      mockFlexStacker.hasAvailableUpdate = true

      render({
        ...props,
        module,
      })
      screen.getByText('Set up module for use.')
      const button = screen.getByText('Set up module')
      fireEvent.click(button)
      expect(vi.mocked(handleModuleWizardFlows)).toHaveBeenCalled()
    })
  })
  it('renders firmware update for no-calibration required modules only if its already in the deck config', () => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [
        {
          cutoutId: 'cutoutB3',
          cutoutFixtureId: 'flexStackerModuleV1',
          opentronsModuleSerialNumber: 'fs123',
        },
      ],
    } as unknown as UseQueryResult<DeckConfiguration>)
    render({
      ...props,
      module: {
        ...mockFlexStacker,
        hasAvailableUpdate: true,
      },
    })
    screen.getByText('Firmware update available.')
    const button = screen.getByText('Update now')
    fireEvent.click(button)
    expect(mockUpdateModuleAsync).toHaveBeenCalledWith('fs123')
  })
  it('renders information when a firmware update is available if it has already been calibrated', () => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [
        {
          cutoutId: 'cutoutB3',
          cutoutFixtureId: 'thermocyclerModuleV1',
          opentronsModuleSerialNumber: 'jkl123',
        },
      ],
    } as unknown as UseQueryResult<DeckConfiguration>)
    render({
      ...props,
      module: mockHotThermo,
    })
    screen.getByText('Firmware update available.')
    const button = screen.getByText('Update now')
    fireEvent.click(button)
    expect(mockUpdateModuleAsync).toHaveBeenCalledWith(
      mockHotThermo.serialNumber
    )
  })
  it('renders information for update available and it fails rendering the fail modal', () => {
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue({
      data: [
        {
          cutoutId: 'cutoutB3',
          cutoutFixtureId: 'thermocyclerModuleV1',
          opentronsModuleSerialNumber: 'jkl123',
        },
      ],
    } as unknown as UseQueryResult<DeckConfiguration>)
    mockUpdateModuleMutation({
      isError: true,
      error: { message: 'ruh roh' },
    })
    render({
      ...props,
      module: mockHotThermo,
    })
    screen.getByText('Firmware update available.')
    expect(screen.getByText('mock firmware update failed modal')).toBeVisible()
  })
  it('renders information for update available and updating now text shows up when update is in progress', () => {
    mockUpdateModuleMutation({ isLoading: true })
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
    vi.mocked(ErrorInfo).mockReturnValue(<div>mock heater shaker error</div>)
    vi.mocked(getIsHeaterShakerAttached).mockReturnValue(true)
    render({
      ...props,
      module: mockHeaterShaker,
    })

    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Mock Heater Shaker Module Data')
    screen.getByText('mock heater shaker error')
  })

  it('renders information for a vacuum module with mocked status', () => {
    render({
      ...props,
      module: mockVacuumModule,
    })

    screen.getByText('Vacuum Module GEN1')
    screen.getByText('Mock Vacuum Module Data')
    screen.getByAltText('vacuumModuleV1')
  })
})
