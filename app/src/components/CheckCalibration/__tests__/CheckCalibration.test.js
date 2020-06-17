// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import { SpinnerModalPage } from '@opentrons/components'

import * as Sessions from '../../../sessions'
import * as Calibration from '../../../calibration'

import * as RobotApi from '../../../robot-api'

import { CheckCalibration } from '../index'
import { Introduction } from '../Introduction'
import { DeckSetup } from '../DeckSetup'
import { TipPickUp } from '../TipPickUp'
import { CheckXYPoint } from '../CheckXYPoint'
import { CheckHeight } from '../CheckHeight'
import { ResultsSummary } from '../ResultsSummary'
import { ConfirmExitModal } from '../ConfirmExitModal'

import type { RequestState } from '../../../robot-api/types'

import type { State } from '../../../types'
import { mockCalibrationCheckSessionAttributes } from '../../../sessions/__fixtures__'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../sessions/selectors')
jest.mock('../../../robot-api/selectors')

type CheckCalibrationSpec = {
  component: React.AbstractComponent<any>,
  childProps?: {},
  currentStep: Calibration.RobotCalibrationCheckStep,
  ...
}

const getRobotSessionOfType: JestMockFn<
  [State, string, Sessions.SessionType],
  $Call<
    typeof Sessions.getRobotSessionOfType,
    State,
    string,
    Sessions.SessionType
  >
> = Sessions.getRobotSessionOfType

const getRequestById: JestMockFn<
  [State, string],
  $Call<typeof RobotApi.getRequestById, State, string>
> = RobotApi.getRequestById

const mockGetDeckDefinitions: JestMockFn<
  [],
  $Call<typeof getDeckDefinitions, any>
> = getDeckDefinitions

describe('CheckCalibration', () => {
  let mockStore
  let render
  let dispatch
  let mockCalibrationCheckSession: Sessions.CalibrationCheckSession = {
    id: 'fake_check_session_id',
    ...mockCalibrationCheckSessionAttributes,
  }
  let mockRequestState: RequestState = {
    status: 'success',
    response: {
      path: '/fake/api/path',
      method: 'POST',
      status: 200,
      ok: true,
    },
  }

  const mockCloseCalibrationCheck = jest.fn()

  const getBackButton = wrapper =>
    wrapper.find({ title: 'exit' }).find('button')

  const getConfirmExitButton = wrapper =>
    wrapper
      .find(ConfirmExitModal)
      .find({ children: 'continue' })
      .find('button')

  const POSSIBLE_CHILDREN = [
    Introduction,
    DeckSetup,
    TipPickUp,
    CheckXYPoint,
    CheckHeight,
    ResultsSummary,
  ]

  const SPECS: Array<CheckCalibrationSpec> = [
    { component: Introduction, currentStep: 'sessionStarted' },
    { component: DeckSetup, currentStep: 'labwareLoaded' },
    { component: TipPickUp, currentStep: 'preparingFirstPipette' },
    { component: TipPickUp, currentStep: 'inspectingFirstTip' },
    { component: TipPickUp, currentStep: 'preparingSecondPipette' },
    { component: TipPickUp, currentStep: 'inspectingSecondTip' },
    { component: CheckXYPoint, currentStep: 'joggingFirstPipetteToPointOne' },
    { component: CheckXYPoint, currentStep: 'comparingFirstPipettePointOne' },
    { component: CheckXYPoint, currentStep: 'joggingFirstPipetteToPointTwo' },
    { component: CheckXYPoint, currentStep: 'comparingFirstPipettePointTwo' },
    { component: CheckXYPoint, currentStep: 'joggingFirstPipetteToPointThree' },
    { component: CheckXYPoint, currentStep: 'comparingFirstPipettePointThree' },
    { component: CheckXYPoint, currentStep: 'joggingSecondPipetteToPointOne' },
    { component: CheckXYPoint, currentStep: 'comparingSecondPipettePointOne' },
    { component: CheckHeight, currentStep: 'joggingFirstPipetteToHeight' },
    { component: CheckHeight, currentStep: 'comparingFirstPipetteHeight' },
    { component: CheckHeight, currentStep: 'joggingSecondPipetteToHeight' },
    { component: CheckHeight, currentStep: 'comparingSecondPipetteHeight' },
    { component: ResultsSummary, currentStep: 'sessionExited' },
    { component: ResultsSummary, currentStep: 'checkComplete' },
  ]

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        robotApi: {},
      }),
      dispatch,
    }
    mockGetDeckDefinitions.mockReturnValue({})

    mockCalibrationCheckSession = {
      id: 'fake_check_session_id',
      ...mockCalibrationCheckSessionAttributes,
    }

    render = () => {
      return mount(
        <CheckCalibration
          robotName="robot-name"
          closeCalibrationCheck={mockCloseCalibrationCheck}
        />,
        {
          wrappingComponent: Provider,
          wrappingComponentProps: { store: mockStore },
        }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('fetches robot cal check session on mount if session in state', () => {
    getRobotSessionOfType.mockReturnValue(mockCalibrationCheckSession)
    render()
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        ...Sessions.fetchSession('robot-name', 'fake_check_session_id'),
        meta: { requestId: expect.any(String) },
      })
    )
  })

  it('creates robot cal check session on mount if no session already in state', () => {
    getRobotSessionOfType.mockReturnValue(null)
    render()
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        ...Sessions.createSession(
          'robot-name',
          Sessions.SESSION_TYPE_CALIBRATION_CHECK
        ),
        meta: { requestId: expect.any(String) },
      })
    )
  })

  SPECS.forEach(spec => {
    it(`renders correct contents when currentStep is ${spec.currentStep}`, () => {
      mockCalibrationCheckSession = {
        ...mockCalibrationCheckSession,
        details: {
          ...mockCalibrationCheckSession.details,
          currentStep: spec.currentStep,
        },
      }
      getRobotSessionOfType.mockReturnValue(mockCalibrationCheckSession)
      const wrapper = render()
      POSSIBLE_CHILDREN.forEach(child => {
        if (child === spec.component) {
          expect(wrapper.exists(child)).toBe(true)
        } else {
          expect(wrapper.exists(child)).toBe(false)
        }
      })
    })

    it(`renders a spinner when a request is pending in ${spec.currentStep}`, () => {
      mockCalibrationCheckSession = {
        ...mockCalibrationCheckSession,
        details: {
          ...mockCalibrationCheckSession.details,
          currentStep: spec.currentStep,
        },
      }

      getRobotSessionOfType.mockReturnValue(mockCalibrationCheckSession)

      mockRequestState = {
        status: 'pending',
      }
      getRequestById.mockReturnValue(mockRequestState)

      const wrapper = render()
      expect(wrapper.exists(SpinnerModalPage)).toBe(true)
    })
  })

  it('pops a confirm exit modal on exit click', () => {
    getRobotSessionOfType.mockReturnValue(mockCalibrationCheckSession)
    const wrapper = render()

    act(() => {
      getBackButton(wrapper).invoke('onClick')()
    })
    wrapper.update()
    expect(wrapper.exists(ConfirmExitModal)).toBe(true)
    expect(mockCloseCalibrationCheck).not.toHaveBeenCalled()
  })

  it('calls deleteRobotCalibrationCheckSession when exit is confirmed', () => {
    getRobotSessionOfType.mockReturnValue(mockCalibrationCheckSession)
    const wrapper = render()

    act(() => {
      getBackButton(wrapper).invoke('onClick')()
    })
    wrapper.update()

    act(() => {
      getConfirmExitButton(wrapper).invoke('onClick')()
    })
    wrapper.update()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        ...Sessions.createSessionCommand(
          'robot-name',
          'fake_check_session_id',
          {
            command: Calibration.checkCommands.EXIT,
            data: {},
          }
        ),
        meta: { requestId: expect.any(String) },
      })
    )
  })
})
