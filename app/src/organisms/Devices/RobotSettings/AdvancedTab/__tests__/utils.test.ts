import { UseQueryResult } from 'react-query'

import { checkIsRobotBusy } from '../utils'

import type { Sessions, SessionData } from '@opentrons/api-client'

// jest.mock('@opentrons/react-api-client')
// jest.mock('../../../../ProtocolUpload/hooks')

describe('utils checkIsRobotBusy', () => {
  it('if session data is empty and no runId return false', () => {
    const mockAllSessionsQueryResponse = {
      data: {},
    } as UseQueryResult<Sessions, Error>
    const isRobotBusy = false
    expect(checkIsRobotBusy(mockAllSessionsQueryResponse, isRobotBusy)).toBe(
      false
    )
  })

  it('if session data is not empty and no runId return true', () => {
    const mockAllSessionsQueryResponse = {
      data: { data: [] as SessionData[] },
    } as UseQueryResult<Sessions, Error>
    const isRobotBusy = false
    expect(checkIsRobotBusy(mockAllSessionsQueryResponse, isRobotBusy)).toBe(
      true
    )
  })

  it('if session data is empty and runId return true', () => {
    const mockAllSessionsQueryResponse = {
      data: {},
    } as UseQueryResult<Sessions, Error>
    const isRobotBusy = true
    expect(checkIsRobotBusy(mockAllSessionsQueryResponse, isRobotBusy)).toBe(
      true
    )
  })
})
