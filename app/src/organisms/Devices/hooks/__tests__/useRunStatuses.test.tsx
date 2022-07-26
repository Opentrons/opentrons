import {
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
import { useRunStatus } from '../../../RunTimeControl/hooks'
import { useRunStatuses } from '..'

jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../../../RunTimeControl/hooks')

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
describe(' useRunStatuses ', () => {
  beforeEach(() => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_RUNNING)
    mockUseCurrentRunId.mockReturnValue('123')
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns everything as false when run status is null', () => {
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunStill: false,
      isRunTerminal: false,
      isRunIdle: false,
    })
  })

  it('returns true isRunStill and Terminal when run status is suceeded', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_SUCCEEDED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it('returns true isRunStill and Terminal when run status is stopped', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_STOPPED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it('returns true isRunStill and Terminal when run status is failed', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_FAILED)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunStill: true,
      isRunTerminal: true,
      isRunIdle: false,
    })
  })

  it('returns true isRunStill and isRunIdle when run status is idle', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_IDLE)
    const result = useRunStatuses()
    expect(result).toStrictEqual({
      isRunStill: true,
      isRunTerminal: false,
      isRunIdle: true,
    })
  })
})
