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
})
