// @flow
import * as React from 'react'
import uniqueId from 'lodash/uniqueId'
import { mountWithStore } from '@opentrons/components/__utils__'
import { act } from 'react-dom/test-utils'

import * as RobotApi from '../../../robot-api'
import * as Sessions from '../../../sessions'
import { mockPipetteOffsetCalibrationSessionAttributes } from '../../../sessions/__fixtures__'

import { useCalibratePipetteOffset } from '../useCalibratePipetteOffset'

import type { State } from '../../../types'
import type { SessionType } from '../../../sessions'

jest.mock('../../../sessions/selectors')
jest.mock('../../../robot-api/selectors')
jest.mock('lodash/uniqueId')

const mockUniqueId: JestMockFn<[string | void], string> = uniqueId
const mockGetRobotSessionOfType: JestMockFn<
  [State, string, SessionType],
  $Call<typeof Sessions.getRobotSessionOfType, State, string, SessionType>
> = Sessions.getRobotSessionOfType
const mockGetRequestById: JestMockFn<
  [State, string],
  $Call<typeof RobotApi.getRequestById, State, string>
> = RobotApi.getRequestById

describe('useCalibratePipetteOffset hook', () => {
  let startCalibration
  let CalWizardComponent
  const robotName = 'robotName'
  const mountString = 'left'
  const onComplete = jest.fn()

  const TestUseCalibratePipetteOffset = () => {
    const [_startCalibration, _CalWizardComponent] = useCalibratePipetteOffset(
      robotName,
      {
        mount: mountString,
        shouldPerformTipLength: false,
        hasCalibrationBlock: false,
        tipRackDefinition: null,
      },
      onComplete
    )
    React.useEffect(() => {
      startCalibration = _startCalibration
      CalWizardComponent = _CalWizardComponent
    })
    return <>{CalWizardComponent}</>
  }

  beforeEach(() => {
    let mockIdCounter = 0
    mockUniqueId.mockImplementation(() => `mockId_${mockIdCounter++}`)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns start callback, and no wizard if session not present', () => {
    const { store } = mountWithStore(<TestUseCalibratePipetteOffset />, {
      initialState: { robotApi: {}, sessions: {} },
    })
    expect(typeof startCalibration).toBe('function')
    expect(CalWizardComponent).toBe(null)

    act(() => startCalibration())

    expect(store.dispatch).toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        robotName,
        Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
        {
          mount: mountString,
          shouldPerformTipLength: false,
          hasCalibrationBlock: false,
          tipRackDefinition: null,
        }
      ),
      meta: { requestId: expect.any(String) },
    })
  })

  it('wizard should appear after create request succeeds with session and close on closeWizard', () => {
    const seshId = 'fake-session-id'
    const mockPipOffsetCalSession = {
      id: seshId,
      ...mockPipetteOffsetCalibrationSessionAttributes,
      details: {
        ...mockPipetteOffsetCalibrationSessionAttributes.details,
        currentStep: Sessions.PIP_OFFSET_STEP_CALIBRATION_COMPLETE,
      },
    }
    const { wrapper } = mountWithStore(<TestUseCalibratePipetteOffset />, {
      initialState: { robotApi: {} },
    })
    mockGetRobotSessionOfType.mockReturnValue(mockPipOffsetCalSession)
    mockGetRequestById.mockReturnValue({
      status: RobotApi.SUCCESS,
      response: {
        method: 'POST',
        ok: true,
        path: '/',
        status: 200,
      },
    })
    act(() => startCalibration())
    wrapper.setProps({})
    expect(CalWizardComponent).not.toBe(null)

    wrapper
      .find('button[title="Return tip to tip rack and exit"]')
      .invoke('onClick')()
    wrapper.setProps({})
    expect(CalWizardComponent).toBe(null)
    expect(onComplete).toHaveBeenCalled()
  })
})
