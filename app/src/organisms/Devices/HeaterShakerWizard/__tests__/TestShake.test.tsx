import * as React from 'react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../../i18n'
import { useLatchControls } from '../../../ModuleCard/hooks'
import { RUN_ID_1 } from '../../../RunTimeControl/__fixtures__'
import heaterShakerCommands from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommands.json'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import { useModuleIdFromRun } from '../../../ModuleCard/useModuleIdFromRun'
import { useRunStatuses } from '../../hooks'
import { TestShake } from '../TestShake'
import { HeaterShakerModuleCard } from '../HeaterShakerModuleCard'

import type { ProtocolModuleInfo } from '../../../Devices/ProtocolRun/utils/getProtocolModulesInfo'

jest.mock('@opentrons/react-api-client')
jest.mock('../HeaterShakerModuleCard')
jest.mock('../../../ModuleCard/hooks')
jest.mock('../../../ModuleCard/useModuleIdFromRun')
jest.mock('../../hooks')

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseCommandMutation = useCreateCommandMutation as jest.MockedFunction<
  typeof useCreateCommandMutation
>
const mockUseLatchControls = useLatchControls as jest.MockedFunction<
  typeof useLatchControls
>
const mockHeaterShakerModuleCard = HeaterShakerModuleCard as jest.MockedFunction<
  typeof HeaterShakerModuleCard
>
const mockUseModuleIdFromRun = useModuleIdFromRun as jest.MockedFunction<
  typeof useModuleIdFromRun
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>

const render = (props: React.ComponentProps<typeof TestShake>) => {
  return renderWithProviders(<TestShake {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const HEATER_SHAKER_PROTOCOL_MODULE_INFO = {
  moduleId: 'heater_shaker_id',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockHeaterShaker as any,
  nestedLabwareDef: heaterShakerCommands.labwareDefinitions['example/plate/1'],
  nestedLabwareDisplayName: 'Source Plate',
  nestedLabwareId: null,
  protocolLoadOrder: 1,
  slotName: '1',
} as ProtocolModuleInfo

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

describe('TestShake', () => {
  let props: React.ComponentProps<typeof TestShake>
  let mockCreateLiveCommand = jest.fn()
  let mockCreateCommand = jest.fn()
  const mockToggleLatch = jest.fn()
  beforeEach(() => {
    props = {
      setCurrentPage: jest.fn(),
      module: mockHeaterShaker,
      moduleFromProtocol: undefined,
    }
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    mockCreateCommand = jest.fn()
    mockUseCommandMutation.mockReturnValue({
      createCommand: mockCreateCommand,
    } as any)
    mockHeaterShakerModuleCard.mockReturnValue(
      <div>Mock Heater Shaker Module Card</div>
    )
    mockUseLatchControls.mockReturnValue({
      handleLatch: jest.fn(),
      isLatchClosed: true,
    } as any)
    mockUseModuleIdFromRun.mockReturnValue({
      moduleIdFromRun: 'heatershaker_id',
    })
    mockUseRunStatuses.mockReturnValue({
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })
  it('renders the correct title', () => {
    const { getByText } = render(props)
    getByText('Step 4 of 4: Test shake')
  })

  it('renders the information banner icon and description', () => {
    const { getByText, getByLabelText } = render(props)
    getByLabelText('information')
    getByText(
      'If you want to add labware to the module before doing a test shake, you can use the labware latch controls to hold the latches open.'
    )
  })

  it('renders labware name in the banner description when there is a protocol', () => {
    props = {
      setCurrentPage: jest.fn(),
      module: mockHeaterShaker,
      moduleFromProtocol: HEATER_SHAKER_PROTOCOL_MODULE_INFO,
    }
    const { getByText } = render(props)
    getByText(
      nestedTextMatcher(
        'If you want to add the Source Plate to the module before doing a test shake, you can use the labware latch controls.'
      )
    )
  })

  it('renders a heater shaker module card', () => {
    const { getByText } = render(props)

    getByText('Mock Heater Shaker Module Card')
  })

  it('renders the close labware latch button and is enabled when latch status is open', () => {
    props = {
      module: mockHeaterShaker,
      setCurrentPage: jest.fn(),
      moduleFromProtocol: undefined,
    }

    mockUseLatchControls.mockReturnValue({
      toggleLatch: mockToggleLatch,
      isLatchClosed: false,
    })

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Close Labware Latch/i })
    expect(button).toBeEnabled()
  })

  it('renders the start shaking button and is disabled', () => {
    props = {
      module: mockCloseLatchHeaterShaker,
      setCurrentPage: jest.fn(),
      moduleFromProtocol: undefined,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start Shaking/i })
    expect(button).toBeDisabled()
  })

  it('renders an input field for speed setting', () => {
    const { getByText, getByRole } = render(props)

    getByText('Set shake speed')
    getByRole('spinbutton')
  })

  it('renders troubleshooting accordion and contents', () => {
    const { getByText, getByRole } = render(props)

    const troubleshooting = getByText('Troubleshooting')
    fireEvent.click(troubleshooting)

    getByText(
      'Return to Step 1 to see instructions for securing the module to the deck.'
    )
    const buttonStep1 = getByRole('button', { name: /Go to Step 1/i })
    expect(buttonStep1).toBeEnabled()

    getByText(
      'Return to Step 3 to see instructions for securing the thermal adapter to the module.'
    )
    const buttonStep2 = getByRole('button', { name: /Go to Step 3/i })
    expect(buttonStep2).toBeEnabled()
  })

  it('start shake button should be disabled if the labware latch is open', () => {
    props = {
      module: mockOpenLatchHeaterShaker,
      setCurrentPage: jest.fn(),
      moduleFromProtocol: undefined,
    }

    mockUseLatchControls.mockReturnValue({
      toggleLatch: mockToggleLatch,
      isLatchClosed: false,
    })

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start/i })
    expect(button).toBeDisabled()
  })

  it('start shake button should be disabled if the input is out of range', () => {
    props = {
      module: mockOpenLatchHeaterShaker,
      setCurrentPage: jest.fn(),
      moduleFromProtocol: undefined,
    }

    mockUseLatchControls.mockReturnValue({
      toggleLatch: mockToggleLatch,
      isLatchClosed: false,
    })

    const { getByRole } = render(props)
    const input = getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '0' } })
    const button = getByRole('button', { name: /Start/i })
    expect(button).toBeDisabled()
  })

  it('clicking the open latch button should open the heater shaker latch', () => {
    props = {
      module: mockCloseLatchHeaterShaker,
      setCurrentPage: jest.fn(),
      moduleFromProtocol: undefined,
    }

    mockUseLatchControls.mockReturnValue({
      toggleLatch: mockToggleLatch,
      isLatchClosed: true,
    })

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Open Labware Latch/i })
    fireEvent.click(button)
    expect(mockToggleLatch).toHaveBeenCalled()
  })

  it('clicking the close latch button should close the heater shaker latch', () => {
    props = {
      module: mockOpenLatchHeaterShaker,
      setCurrentPage: jest.fn(),
      moduleFromProtocol: undefined,
    }

    mockUseLatchControls.mockReturnValue({
      toggleLatch: mockToggleLatch,
      isLatchClosed: false,
    })

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Close Labware Latch/i })
    fireEvent.click(button)
    expect(mockToggleLatch).toHaveBeenCalled()
  })

  it('entering an input for shake speed and clicking start should begin shaking when there is no run id', () => {
    props = {
      module: mockCloseLatchHeaterShaker,
      setCurrentPage: jest.fn(),
      moduleFromProtocol: undefined,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start Shaking/i })
    const input = getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '300' } })
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/setAndWaitForShakeSpeed',
        params: {
          moduleId: 'heatershaker_id',
          rpm: 300,
        },
      },
    })
  })

  it('when the heater shaker is shaking clicking stop should deactivate the shaking when there is no run id', () => {
    props = {
      module: mockMovingHeaterShaker,
      setCurrentPage: jest.fn(),
      moduleFromProtocol: undefined,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Stop Shaking/i })
    const input = getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '200' } })
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/deactivateShaker',
        params: {
          moduleId: mockHeaterShaker.id,
        },
      },
    })
  })

  //  next test is sending module commands when run is terminal and through module controls
  it('entering an input for shake speed and clicking start should begin shaking when there is a run id and run is terminal', () => {
    mockUseRunStatuses.mockReturnValue({
      isRunStill: false,
      isRunTerminal: true,
      isRunIdle: false,
    })

    props = {
      module: mockHeaterShaker,
      setCurrentPage: jest.fn(),
      moduleFromProtocol: HEATER_SHAKER_PROTOCOL_MODULE_INFO,
      currentRunId: RUN_ID_1,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start Shaking/i })
    const input = getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '300' } })
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/setAndWaitForShakeSpeed',
        params: {
          moduleId: 'heatershaker_id',
          rpm: 300,
        },
      },
    })
  })

  //  next test is sending module commands when run is terminal and through device details module cards
  it('entering an input for shake speed and clicking start should begin shaking when there is a run id, run is terminal, and through device details', () => {
    mockUseRunStatuses.mockReturnValue({
      isRunStill: false,
      isRunTerminal: true,
      isRunIdle: false,
    })
    props = {
      module: mockCloseLatchHeaterShaker,
      setCurrentPage: jest.fn(),
      moduleFromProtocol: undefined,
      currentRunId: RUN_ID_1,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start Shaking/i })
    const input = getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '300' } })
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/setAndWaitForShakeSpeed',
        params: {
          moduleId: 'heatershaker_id',
          rpm: 300,
        },
      },
    })
  })
})
