// @flow

import { makeEvent } from '../make-event'

import * as Sessions from '../../sessions'
import * as sessionsFixtures from '../../sessions/__fixtures__'

import type { State } from '../../types'
import type { SessionAnalyticsProps } from '../../sessions/types'

jest.mock('../../sessions/selectors')

const getAnalyticsPropsForRobotSessionById: JestMockFn<
  [State, string, string],
  SessionAnalyticsProps | null
> = Sessions.getAnalyticsPropsForRobotSessionById

const MOCK_STATE: State = ({ mockState: true }: any)

describe('events with calibration check session data', () => {
  beforeEach(() => {
    getAnalyticsPropsForRobotSessionById.mockImplementation(state => {
      expect(state).toBe(MOCK_STATE)
      return sessionsFixtures.mockCalibrationCheckSessionAnalyticsProps
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
      name: 'sessionExit',
      properties: sessionsFixtures.mockCalibrationCheckSessionAnalyticsProps,
    })
  })
})
