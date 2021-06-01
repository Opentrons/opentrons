import * as React from 'react'
import uniqueId from 'lodash/uniqueId'
import { mountWithStore } from '@opentrons/components/__utils__'
import { act } from 'react-dom/test-utils'

import * as RobotApi from '../../../redux/robot-api'
import * as Sessions from '../../../redux/sessions'
import { mockPipetteOffsetCalibrationSessionAttributes } from '../../../redux/sessions/__fixtures__'

import { useCalibratePipetteOffset } from '../useCalibratePipetteOffset'
import { INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL } from '../../../organisms/CalibrationPanels'
import { pipetteOffsetCalibrationStarted } from '../../../redux/analytics'

import type { Invoker } from '../useCalibratePipetteOffset'

jest.mock('../../../redux/sessions/selectors')
jest.mock('../../../redux/robot-api/selectors')
jest.mock('lodash/uniqueId')

const mockUniqueId = uniqueId as jest.MockedFunction<typeof uniqueId>
const mockGetRobotSessionOfType = Sessions.getRobotSessionOfType as jest.MockedFunction<
  typeof Sessions.getRobotSessionOfType
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>

describe('useCalibratePipetteOffset hook', () => {
  let startCalibration: Invoker
  let CalWizardComponent: JSX.Element | null
  const robotName = 'robotName'
  const mountString = 'left'
  const onComplete = jest.fn()

  const TestUseCalibratePipetteOffset = (): JSX.Element => {
    const [_startCalibration, _CalWizardComponent] = useCalibratePipetteOffset(
      robotName,
      {
        mount: mountString,
        shouldRecalibrateTipLength: false,
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

    act(() => startCalibration({}))

    expect(store.dispatch).toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        robotName,
        Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
        {
          mount: mountString,
          shouldRecalibrateTipLength: false,
          hasCalibrationBlock: false,
          tipRackDefinition: null,
        }
      ),
      meta: { requestId: expect.any(String) },
    })
    expect(store.dispatch).toHaveBeenCalledWith(
      pipetteOffsetCalibrationStarted(
        'pipette-offset',
        mountString,
        false,
        false,
        null
      )
    )
  })

  it('accepts createParam overrides in start callback', () => {
    const { store } = mountWithStore(<TestUseCalibratePipetteOffset />, {
      initialState: { robotApi: {}, sessions: {} },
    })
    expect(typeof startCalibration).toBe('function')
    expect(CalWizardComponent).toBe(null)

    act(() =>
      startCalibration({
        overrideParams: { mount: 'other-mount', hasCalibrationBlock: true },
      })
    )

    expect(store.dispatch).toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        robotName,
        Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
        {
          mount: 'other-mount',
          shouldRecalibrateTipLength: false,
          hasCalibrationBlock: true,
          tipRackDefinition: null,
        }
      ),
      meta: { requestId: expect.any(String) },
    })
  })

  it('accepts intent in start callback', () => {
    const { wrapper } = mountWithStore(<TestUseCalibratePipetteOffset />, {
      initialState: { robotApi: {}, sessions: {} },
    })
    expect(typeof startCalibration).toBe('function')
    expect(CalWizardComponent).toBe(null)
    const seshId = 'fake-session-id'
    const mockPipOffsetCalSession = {
      id: seshId,
      ...mockPipetteOffsetCalibrationSessionAttributes,
      details: {
        ...mockPipetteOffsetCalibrationSessionAttributes.details,
        currentStep: Sessions.PIP_OFFSET_STEP_CALIBRATION_COMPLETE,
      },
    }
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
    act(() =>
      startCalibration({
        withIntent: INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
      })
    )
    wrapper.setProps({})
    expect(CalWizardComponent).not.toBe(null)
    expect(wrapper.find('CalibratePipetteOffset').prop('intent')).toEqual(
      INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL
    )
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
    const { store, wrapper } = mountWithStore(
      <TestUseCalibratePipetteOffset />,
      {
        initialState: { robotApi: {} },
      }
    )
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
    act(() => startCalibration({}))
    wrapper.setProps({})
    expect(CalWizardComponent).not.toBe(null)

    wrapper
      .find('button[title="Return tip to tip rack and exit"]')
      .invoke('onClick')?.({} as React.MouseEvent)
    wrapper.setProps({})
    expect(store.dispatch).toHaveBeenCalledWith({
      ...Sessions.deleteSession(robotName, seshId),
      meta: { requestId: expect.any(String) },
    })
    mockGetRobotSessionOfType.mockReturnValue(null)
    wrapper.setProps({})
    expect(CalWizardComponent).toBe(null)
    expect(onComplete).toHaveBeenCalled()
  })
})
