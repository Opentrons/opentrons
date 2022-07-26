import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { RunCommandSummary } from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import { i18n } from '../../../../i18n'
import { getLabwareLocation } from '../../ProtocolRun/utils/getLabwareLocation'
import {
  useLabwareRenderInfoForRunById,
  useProtocolDetailsForRun,
} from '../../hooks'
import { RunLogProtocolSetupInfo } from '../RunLogProtocolSetupInfo'
import { StepText } from '../StepText'

import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command'

jest.mock('@opentrons/shared-data/js/helpers')
jest.mock('../../ProtocolRun/utils/getLabwareLocation')
jest.mock('../../hooks')
jest.mock('./../RunLogProtocolSetupInfo')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseLabwareRenderInfoForRunById = useLabwareRenderInfoForRunById as jest.MockedFunction<
  typeof useLabwareRenderInfoForRunById
>
const mockGetLabwareDisplayName = getLabwareDisplayName as jest.MockedFunction<
  typeof getLabwareDisplayName
>
const mockGetLabwareLocation = getLabwareLocation as jest.MockedFunction<
  typeof getLabwareLocation
>
const mockRunLogProtocolSetupInfo = RunLogProtocolSetupInfo as jest.MockedFunction<
  typeof RunLogProtocolSetupInfo
>

const render = (props: React.ComponentProps<typeof StepText>) => {
  return renderWithProviders(<StepText {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const ROBOT_NAME = 'otie'
const RUN_ID = 'ab60e8ff-e281-4219-9f7c-61fc816482dd'

const MOCK_ANALYSIS_COMMAND: RunTimeCommand = {
  id: 'some_id',
  commandType: 'custom',
  status: 'queued',
  params: {},
} as any

const MOCK_COMMAND_SUMMARY: RunCommandSummary = {
  id: '123',
  commandType: 'custom',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_PAUSE_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'pause',
  params: { message: 'THIS IS THE PAUSE MESSAGE' },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_WAIT_FOR_RESUME_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'waitForResume',
  params: { message: 'THIS IS THE PAUSE MESSAGE' },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_WAIT_FOR_RESUME_NO_MESSAGE_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'waitForResume',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_LOAD_COMMAND = {
  id: '1234',
  commandType: 'loadModule',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
}

const MOCK_ENGAGE_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'magneticModule/engage',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_DISENGAGE_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'magneticModule/disengage',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_SET_TARGET_TEMP_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'temperatureModule/setTargetTemperature',
  params: { celsius: 50 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_DEACTIVATE_TEMP_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'temperatureModule/deactivate',
  params: { celsius: 50 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_AWAIT_TEMP_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'temperatureModule/waitForTemperature',
  params: { celsius: 50 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_SET_TC_BLOCK_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'thermocycler/setTargetBlockTemperature',
  params: { celsius: 50 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_SET_TC_LID_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'thermocycler/setTargetLidTemperature',
  params: { celsius: 50 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_AWAIT_TC_BLOCK_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'thermocycler/waitForBlockTemperature',
  params: { celsius: 50 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_AWAIT_TC_LID_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'thermocycler/waitForLidTemperature',
  params: { celsius: 50 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_OPEN_TC_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'thermocycler/openLid',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_CLOSE_TC_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'thermocycler/closeLid',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_DEACTIVATE_TC_BLOCK_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'thermocycler/deactivateBlock',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_DEACTIVATE_TC_LID_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'thermocycler/deactivateLid',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_TC_PROFILE_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'thermocycler/runProfile',
  params: {
    profile: [
      {
        holdSeconds: 60,
        celsius: 50,
      },
      {
        holdSeconds: 30,
        celsius: 20,
      },
      {
        holdSeconds: 10,
        celsius: 10,
      },
    ],
  },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_TC_WAIT_FOR_PROFILE_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'thermocycler/awaitProfileComplete',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_HS_SET_TEMP: RunTimeCommand = {
  id: '1234',
  commandType: 'heaterShaker/setTargetTemperature',
  params: { celsius: 50 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_HS_AWAIT_TEMP: RunTimeCommand = {
  id: '1234',
  commandType: 'heaterShaker/waitForTemperature',
  params: { celsius: 50 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_HS_SET_SHAKE: RunTimeCommand = {
  id: '1234',
  commandType: 'heaterShaker/setAndWaitForShakeSpeed',
  params: { rpm: 500 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_HS_DEACTIVATE_TEMP: RunTimeCommand = {
  id: '1234',
  commandType: 'heaterShaker/deactivateHeater',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_HS_OPEN_LATCH: RunTimeCommand = {
  id: '1234',
  commandType: 'heaterShaker/openLabwareLatch',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_HS_CLOSE_LATCH: RunTimeCommand = {
  id: '1234',
  commandType: 'heaterShaker/closeLabwareLatch',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_HS_DEACTIVATE_SHAKE: RunTimeCommand = {
  id: '1234',
  commandType: 'heaterShaker/deactivateShaker',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_WAIT_FOR_DURATION_COMMAND: RunTimeCommand = {
  id: '1234',
  commandType: 'waitForDuration',
  params: { seconds: 60 },
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

describe('StepText', () => {
  beforeEach(() => {
    mockUseProtocolDetailsForRun.mockReturnValue({
      protocolData: { commands: [] },
    } as any)
    mockUseLabwareRenderInfoForRunById.mockReturnValue({} as any)
    mockRunLogProtocolSetupInfo.mockReturnValue(
      <div>Mock Protocol Setup Step</div>
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders correct command text for custom legacy commands', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: MOCK_ANALYSIS_COMMAND,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        params: { legacyCommandText: 'legacy command text' } as any,
      },
    })
    getByText('legacy command text')
  })

  it('renders correct command text for pause commands', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_PAUSE_COMMAND as RunCommandSummary,
    })
    getByText('THIS IS THE PAUSE MESSAGE')
  })

  it('renders correct command text for wait for resume commands', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_WAIT_FOR_RESUME_COMMAND as RunCommandSummary,
    })
    getByText('THIS IS THE PAUSE MESSAGE')
  })

  it('renders correct text for wait for resume without message', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_WAIT_FOR_RESUME_NO_MESSAGE_COMMAND as RunCommandSummary,
    })
    getByText('Pausing protocol')
  })

  it('renders correct command text for load commands', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_LOAD_COMMAND as RunCommandSummary,
    })
    getByText('Mock Protocol Setup Step')
  })

  it('renders correct command text for pick up tip', () => {
    const labwareId = 'labwareId'
    const wellName = 'wellName'
    when(mockGetLabwareDisplayName)
      .calledWith('fake_def' as any)
      .mockReturnValue('fake_display_name')
    when(mockGetLabwareLocation)
      .calledWith(labwareId, [])
      .mockReturnValue({ slotName: 'fake_labware_location' })
    mockUseLabwareRenderInfoForRunById.mockReturnValue({
      labwareId: {
        labwareDef: 'fake_def',
      },
    } as any)
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'pickUpTip',
        params: {
          wellName,
          labwareId,
        },
      },
    })
    getByText(
      'Picking up tip from wellName of fake_display_name in fake_labware_location'
    )
  })

  it('renders correct command text for for legacy command with non-string text', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'custom',
        params: {
          legacyCommandType: 'anyLegacyCommand',
          legacyCommandText: { someKey: ['someValue', 'someOtherValue'] },
        },
      },
    })
    getByText('{"someKey":["someValue","someOtherValue"]}')
  })

  it('renders correct command text for engage magnetic module', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_ENGAGE_COMMAND as RunCommandSummary,
    })
    getByText('Engaging Magnetic Module')
  })

  it('renders correct command text for disengage magnetic module', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_DISENGAGE_COMMAND as RunCommandSummary,
    })
    getByText('Disengaging Magnetic Module')
  })

  it('renders correct command text for set temperature on temp module', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_SET_TARGET_TEMP_COMMAND as RunCommandSummary,
    })
    getByText(
      'Setting Temperature Module temperature to 50°C (rounded off to nearest integer)'
    )
  })

  it('renders correct command text for deactivating temp module', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_DEACTIVATE_TEMP_COMMAND as RunCommandSummary,
    })
    getByText('Deactivating Temperature Module')
  })

  it('renders correct command text for awaiting temp on temperature module', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_AWAIT_TEMP_COMMAND as RunCommandSummary,
    })
    getByText(
      'Waiting for Temperature Module to reach temperature 50°C (rounded off to nearest integer)'
    )
  })

  it('renders correct command text for setting TC block temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_SET_TC_BLOCK_COMMAND as RunCommandSummary,
    })
    getByText('Setting Thermocycler well block temperature to 50°C')
  })

  it('renders correct command text for setting TC lid temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_SET_TC_LID_COMMAND as RunCommandSummary,
    })
    getByText('Setting Thermocycler lid temperature to 50°C')
  })

  it('renders correct command text for awaiting TC block temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_AWAIT_TC_BLOCK_COMMAND as RunCommandSummary,
    })
    getByText('Waiting for Thermocycler block to reach target temperature')
  })

  it('renders correct command text for awaiting TC lid temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_AWAIT_TC_LID_COMMAND as RunCommandSummary,
    })
    getByText('Waiting for Thermocycler lid to reach target temperature')
  })

  it('renders correct command text for opening tc lid', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_OPEN_TC_COMMAND as RunCommandSummary,
    })
    getByText('Opening Thermocycler lid')
  })

  it('renders correct command text for closing tc lid', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_CLOSE_TC_COMMAND as RunCommandSummary,
    })
    getByText('Closing Thermocycler lid')
  })

  it('renders correct command text for deactivating tc block', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_DEACTIVATE_TC_BLOCK_COMMAND as RunCommandSummary,
    })
    getByText('Deactivating Thermocycler block')
  })

  it('renders correct command text for deactivating tc lid', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_DEACTIVATE_TC_LID_COMMAND as RunCommandSummary,
    })
    getByText('Deactivating Thermocycler lid')
  })
  it('renders correct command text for tc profile starting', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_TC_PROFILE_COMMAND as RunCommandSummary,
    })
    getByText(
      'Thermocycler starting 3 repetitions of cycle composed of the following steps:'
    )
    getByText('temperature: 50°C, seconds: 60')
    getByText('temperature: 20°C, seconds: 30')
    getByText('temperature: 10°C, seconds: 10')
  })

  it('renders correct command text for holding tc time', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_TC_WAIT_FOR_PROFILE_COMMAND as RunCommandSummary,
    })
    getByText('Waiting for hold time duration')
  })

  it('renders correct command text for setting HS temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_HS_SET_TEMP as RunCommandSummary,
    })
    getByText('Setting Target Temperature of Heater-Shaker to 50°C')
  })

  it('renders correct command text for setting HS shake', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_HS_SET_SHAKE as RunCommandSummary,
    })
    getByText(
      'Setting Heater-Shaker to shake at 500 rpm and waiting until reached'
    )
  })

  it('renders correct command text for waiting HS temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_HS_AWAIT_TEMP as RunCommandSummary,
    })
    getByText('Waiting for Heater-Shaker to reach target temperature')
  })

  it('renders correct command text for deactivate HS temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_HS_DEACTIVATE_TEMP as RunCommandSummary,
    })
    getByText('Deactivating Heater-Shaker Heater')
  })

  it('renders correct command text for deactivate HS shake', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_HS_DEACTIVATE_SHAKE as RunCommandSummary,
    })
    getByText('Deactivating Heater-Shaker Shaker')
  })

  it('renders correct command text for close hs latch', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_HS_CLOSE_LATCH as RunCommandSummary,
    })
    getByText('Latching labware on Heater-Shaker')
  })

  it('renders correct command text for open hs latch', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_HS_OPEN_LATCH as RunCommandSummary,
    })
    getByText('Unlatching labware on Heater-Shaker')
  })

  it('renders correct command text for wait for duration', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_WAIT_FOR_DURATION_COMMAND as RunCommandSummary,
    })
    getByText('Pause for 60 seconds')
  })
})
