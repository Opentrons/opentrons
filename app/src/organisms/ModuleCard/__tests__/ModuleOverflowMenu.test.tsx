import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import {
  mockMagneticModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockHeaterShaker,
} from '../../../redux/modules/__fixtures__'
import { useRunStatuses } from '../../Devices/hooks'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { ModuleOverflowMenu } from '../ModuleOverflowMenu'
import { useModuleIdFromRun } from '../useModuleIdFromRun'

jest.mock('../useModuleIdFromRun')
jest.mock('../../Devices/hooks')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../ProtocolUpload/hooks')

const mockUseModuleIdFromRun = useModuleIdFromRun as jest.MockedFunction<
  typeof useModuleIdFromRun
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>

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

const mockOpenLatchHeaterShaker = {
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
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

const mockUnknownLatchHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_unknown',
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

describe('ModuleOverflowMenu', () => {
  let props: React.ComponentProps<typeof ModuleOverflowMenu>
  beforeEach(() => {
    mockUseModuleIdFromRun.mockReturnValue({ moduleIdFromRun: 'magdeck_id' })
    mockUseRunStatuses.mockReturnValue({
      isLegacySessionInProgress: false,
      isRunStill: true,
      isRunTerminal: false,
      isRunIdle: false,
    })
    mockUseCurrentRunId.mockReturnValue(null)
    props = {
      module: mockMagneticModule,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
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
      module: mockTemperatureModuleGen2,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
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
      module: mockThermocycler,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
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
  })
  it('renders the correct Heater Shaker module menu', () => {
    props = {
      module: mockHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    getByRole('button', {
      name: 'Set module temperature',
    })
    getByRole('button', {
      name: 'Set shake speed',
    })
    getByRole('button', {
      name: 'Close Labware Latch',
    })
    const aboutButton = getByRole('button', { name: 'About module' })
    getByRole('button', { name: 'See how to attach to deck' })
    const testButton = getByRole('button', { name: 'Test shake' })
    fireEvent.click(testButton)
    expect(props.handleTestShakeClick).toHaveBeenCalled()
    fireEvent.click(aboutButton)
    expect(props.handleAboutClick).toHaveBeenCalled()
  })
  it('renders heater shaker see how to attach to deck button and when clicked, launches hs wizard', () => {
    props = {
      module: mockHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    const btn = getByRole('button', { name: 'See how to attach to deck' })
    fireEvent.click(btn)
    expect(props.handleWizardClick).toHaveBeenCalled()
  })

  it('renders heater shaker labware latch button and is disabled when status is not idle', () => {
    props = {
      module: mockMovingHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    expect(
      getByRole('button', {
        name: 'Open Labware Latch',
      })
    ).toBeDisabled()
  })

  it('renders heater shaker shake button and is disabled when latch is opened', () => {
    props = {
      module: mockOpenLatchHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    expect(
      getByRole('button', {
        name: 'Set shake speed',
      })
    ).toBeDisabled()
  })

  it('renders heater shaker labware latch button and when clicked, moves labware latch open', () => {
    props = {
      module: mockCloseLatchHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
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
      module: mockHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Close Labware Latch',
    })

    fireEvent.click(btn)
  })

  it('renders heater shaker set shake speed button disabled when labware latch status is unknown', () => {
    props = {
      module: mockUnknownLatchHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
      isLoadedInRun: false,
    }
    const { getByRole } = render(props)
    expect(
      getByRole('button', {
        name: 'Set shake speed',
      })
    ).toBeDisabled()
  })

  it('renders heater shaker overflow menu and deactivates heater when status changes', () => {
    props = {
      module: mockDeactivateHeatHeaterShaker,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
      isLoadedInRun: false,
    }

    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Deactivate',
    })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
  })

  it('renders temperature module overflow menu and deactivates heat when status changes', () => {
    props = {
      module: mockTemperatureModuleHeating,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
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
      module: mockMagDeckEngaged,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
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
      module: mockTCBlockHeating,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
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
    mockUseRunStatuses.mockReturnValue({
      isLegacySessionInProgress: false,
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: true,
    })
    props = {
      module: mockTCBlockHeating,
      handleSlideoutClick: jest.fn(),
      handleAboutClick: jest.fn(),
      handleTestShakeClick: jest.fn(),
      handleWizardClick: jest.fn(),
      isLoadedInRun: true,
      runId: 'id',
    }

    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Deactivate block',
    })
    expect(btn).toBeDisabled()
  })
})
