// @flow

import { makeEvent } from '../make-event'

import * as Sessions from '../../sessions'
import * as calibrationFixtures from '../../calibration/__fixtures__'

import type { State } from '../../types'
import type { Session } from '../../sessions/types'

jest.mock('../../sessions/selectors')

const getRobotSessionOfType: JestMockFn<
  [State, string, string],
  Session | null
> = Sessions.getRobotSessionOfType

const MOCK_STATE: State = ({ mockState: true }: any)
const MOCK_CAL_CHECK_SESSION = {
  id: 'fake_session_id',
  sessionType: Sessions.SESSION_TYPE_CALIBRATION_CHECK,
  details: calibrationFixtures.mockRobotCalibrationCheckSessionDetails,
}

describe('events with calibration check session data', () => {
  beforeEach(() => {
    getRobotSessionOfType.mockImplementation(state => {
      expect(state).toBe(MOCK_STATE)
      return MOCK_CAL_CHECK_SESSION
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('sessions:DELETE_SESSION of type Calibration Check > calibrationCheckExit', () => {
    const deleteSession = Sessions.deleteSession(
      'sacrosanct_coelacanth',
      'fake_session_id'
    )

    return expect(makeEvent(deleteSession, MOCK_STATE)).resolves.toEqual({
      name: 'calibrationCheckExit',
      properties: Sessions.getAnalyticsPropsForSession(MOCK_CAL_CHECK_SESSION),
    })
  })
})
