import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import {
  mockMagneticModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockHeaterShaker,
  mockThermocyclerGen2,
} from '../../../redux/modules/__fixtures__'
import {
  useRunStatuses,
  useIsLegacySessionInProgress,
  useIsOT3,
} from '../../Devices/hooks'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { ModuleOverflowMenu } from '../ModuleOverflowMenu'

jest.mock('../../Devices/hooks')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../ProtocolUpload/hooks')

const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseIsLegacySessionsInProgress = useIsLegacySessionInProgress as jest.MockedFunction<
  typeof useIsLegacySessionInProgress
>
const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>
const render = (props: React.ComponentProps<typeof ModuleOverflowMenu>) => {
  return renderWithProviders(<ModuleOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockMovingHeaterShaker = {
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
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

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
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

const mockDeactivateHeatHeaterShaker = {
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
    temperatureStatus: 'holding at target',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: 45,
    errorDetails: null,
    status: 'heating',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
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
    currentTemp: 25,
    targetTemp: null,
    status: 'heating',
  },
  usbPort: { path: '/dev/ot_module_tempdeck0', port: 1 },
} as any

const mockMagDeckEngaged = {
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
    status: 'engaged',
  },
  usbPort: { path: '/dev/ot_module_magdeck0', port: 1 },
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
    status: 'heating',
  },
  usbPort: { path: '/dev/ot_module_thermocycler0', port: 1 },
} as any

const mockThermocyclerGen2LidClosed = {
  id: 'thermocycler_id2',
  moduleModel: 'thermocyclerModuleV2',
  moduleType: 'thermocyclerModuleType',
  data: {
    lidStatus: 'closed',
  },
} as any

describe('ModuleOverflowMenu', () => {
  let props: React.ComponentProps<typeof ModuleOverflowMenu>
  beforeEach(() => {
    mockUseIsLegacySessionsInProgress.mockReturnValue(false)
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: true,
      isRunTerminal: false,
      isRunIdle: false,
    })
    mockUseCurrentRunId.mockReturnValue(null)
    mockUseIsOT3.mockReturnValue(false)
    props = {
      robotName: 'otie',
      module: mockMagneticModule,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the correct magnetic module menu', () => {
    const { getByText } = render(props)
    getByText('Set engage height')
    getByText('About module')
  })

  it('renders the correct temperature module menu', () => {
    props = {
      robotName: 'otie',
      module: mockTemperatureModuleGen2,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    const buttonSetting = getByRole('button', {
      name: 'Set module temperature',
    })
    fireEvent.click(buttonSetting)
    expect(props.handleSlideoutClick).toHaveBeenCalled()
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(props.handleAboutClick).toHaveBeenCalled()
  })
  it('renders the correct TC module menu', () => {
    props = {
      robotName: 'otie',
      module: mockThermocycler,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    const buttonSettingLid = getByRole('button', {
      name: 'Set lid temperature',
    })
    fireEvent.click(buttonSettingLid)
    expect(props.handleSlideoutClick).toHaveBeenCalled()
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(props.handleAboutClick).toHaveBeenCalled()
    const buttonSettingBlock = getByRole('button', {
      name: 'Set block temperature',
    })
    fireEvent.click(buttonSettingBlock)
    expect(props.handleSlideoutClick).toHaveBeenCalled()
    getByRole('button', { name: 'Close lid' })
  })
  it('renders the correct Heater Shaker module menu', () => {
    props = {
      robotName: 'otie',
      module: mockHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    getByRole('button', {
      name: 'Set module temperature',
    })
    getByRole('button', {
      name: 'Close Labware Latch',
    })
    const aboutButton = getByRole('button', { name: 'About module' })
    getByRole('button', { name: 'Show attachment instructions' })
    const testButton = getByRole('button', { name: 'Test Shake' })
    fireEvent.click(testButton)
    expect(props.handleTestShakeClick).toHaveBeenCalled()
    fireEvent.click(aboutButton)
    expect(props.handleAboutClick).toHaveBeenCalled()
  })
  it('renders heater shaker show attachment instructions button and when clicked, launches hs wizard', () => {
    props = {
      robotName: 'otie',
      module: mockHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    const btn = getByRole('button', { name: 'Show attachment instructions' })
    fireEvent.click(btn)
    expect(props.handleInstructionsClick).toHaveBeenCalled()
  })

  it('renders heater shaker labware latch button and is disabled when status is not idle', () => {
    props = {
      robotName: 'otie',
      module: mockMovingHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    expect(
      getByRole('button', {
        name: 'Open Labware Latch',
      })
    ).toBeDisabled()
  })

  it('renders heater shaker labware latch button and when clicked, moves labware latch open', () => {
    props = {
      robotName: 'otie',
      module: mockCloseLatchHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }

    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Open Labware Latch',
    })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
  })

  it('renders heater shaker labware latch button and when clicked, moves labware latch close', () => {
    props = {
      robotName: 'otie',
      module: mockHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Close Labware Latch',
    })

    fireEvent.click(btn)
  })

  it('renders heater shaker overflow menu and deactivates heater when status changes', () => {
    props = {
      robotName: 'otie',
      module: mockDeactivateHeatHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }

    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Deactivate heater',
    })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
  })

  it('renders temperature module overflow menu and deactivates heat when status changes', () => {
    props = {
      robotName: 'otie',
      module: mockTemperatureModuleHeating,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }

    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Deactivate module',
    })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
  })

  it('renders magnetic module overflow menu and disengages when status changes', () => {
    props = {
      robotName: 'otie',
      module: mockMagDeckEngaged,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }

    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Disengage module',
    })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
  })

  it('renders thermocycler overflow menu and deactivates block when status changes', () => {
    props = {
      robotName: 'otie',
      module: mockTCBlockHeating,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }

    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Deactivate block',
    })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
  })

  it('should disable module control buttons when the robot is busy and run status not null', () => {
    mockUseIsLegacySessionsInProgress.mockReturnValue(true)
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: true,
    })
    props = {
      robotName: 'otie',
      module: mockTCBlockHeating,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: true,
      runId: 'id',
    }

    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Deactivate block',
    })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
  })

  it('should disable overflow menu buttons for thermocycler gen 1 when the robot is an OT-3', () => {
    props = {
      robotName: 'otie',
      module: mockTCBlockHeating,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: true,
      runId: 'id',
    }
    mockUseIsOT3.mockReturnValue(true)
    const { getByRole } = render(props)

    expect(
      getByRole('button', {
        name: 'Set lid temperature',
      })
    ).toBeDisabled()
    expect(
      getByRole('button', {
        name: 'Close lid',
      })
    ).toBeDisabled()
    expect(
      getByRole('button', {
        name: 'Deactivate block',
      })
    ).toBeDisabled()
    expect(
      getByRole('button', {
        name: 'About module',
      })
    ).toBeDisabled()
  })

  it('renders the correct Thermocycler gen 2 menu', () => {
    props = {
      robotName: 'otie',
      module: mockThermocyclerGen2,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    const setLid = getByRole('button', {
      name: 'Set lid temperature',
    })
    getByRole('button', {
      name: 'Close lid',
    })
    const setBlock = getByRole('button', { name: 'Set block temperature' })
    const about = getByRole('button', { name: 'About module' })
    fireEvent.click(setLid)
    expect(props.handleSlideoutClick).toHaveBeenCalled()
    fireEvent.click(setBlock)
    expect(props.handleSlideoutClick).toHaveBeenCalled()
    fireEvent.click(about)
    expect(props.handleAboutClick).toHaveBeenCalled()
  })

  it('renders the correct Thermocycler gen 2 menu with the lid closed', () => {
    props = {
      robotName: 'otie',
      module: mockThermocyclerGen2LidClosed,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    const setLid = getByRole('button', {
      name: 'Set lid temperature',
    })
    getByRole('button', {
      name: 'Open lid',
    })
    const setBlock = getByRole('button', { name: 'Deactivate block' })
    const about = getByRole('button', { name: 'About module' })
    fireEvent.click(setLid)
    expect(props.handleSlideoutClick).toHaveBeenCalled()
    fireEvent.click(setBlock)
    expect(props.handleSlideoutClick).toHaveBeenCalled()
    fireEvent.click(about)
    expect(props.handleAboutClick).toHaveBeenCalled()
  })

  it('renders the correct Thermocycler gen 2 menu with disabled buttons when run status is running', () => {
    mockUseCurrentRunId.mockReturnValue('123')
    mockUseRunStatuses.mockReturnValue({
      isRunRunning: true,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })

    props = {
      robotName: 'otie',
      module: mockThermocyclerGen2LidClosed,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleInstructionsClick: jest.fn(),
      handleCalibrateClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    const setLid = getByRole('button', {
      name: 'Set lid temperature',
    })
    const changeLid = getByRole('button', {
      name: 'Open lid',
    })
    const setBlock = getByRole('button', { name: 'Deactivate block' })
    const about = getByRole('button', { name: 'About module' })
    expect(setLid).toBeDisabled()
    expect(changeLid).toBeDisabled()
    expect(setBlock).toBeDisabled()
    expect(about).not.toBeDisabled()
  })
})
