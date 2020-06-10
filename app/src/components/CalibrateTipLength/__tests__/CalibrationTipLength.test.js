// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import * as Sessions from '../../../sessions'
import * as Calibration from '../../../calibration'
import { mockRobotCalibrationCheckSessionDetails } from '../../../calibration/__fixtures__'

import { CalibrateTipLength } from '../index'
import { Introduction } from '../Introduction'
import { DeckSetup } from '../DeckSetup'
import { MeasureNozzle } from '../MeasureNozzle'
import { TipPickUp } from '../TipPickUp'
import { InspectingTip } from '../InspectingTip'
import { MeasureTip } from '../MeasureTip'
import { CompleteConfirmation } from '../CompleteConfirmation'

import type { State } from '../../../types'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../sessions/selectors')

type CalibrateTipLengthSpec = {
  component: React.AbstractComponent<any>,
  childProps?: {},
  currentStep: Calibration.RobotCalibrationCheckStep,
  ...
}

const getRobotSessionOfType: JestMockFn<
  [State, string, string],
  $Call<typeof Sessions.getRobotSessionOfType, State, string, string>
> = Sessions.getRobotSessionOfType

const mockGetDeckDefinitions: JestMockFn<
  [],
  $Call<typeof getDeckDefinitions, any>
> = getDeckDefinitions

describe('CalibrateTipLength', () => {
  let mockStore
  let render
  let dispatch

  const mockCloseCalibrationCheck = jest.fn()

  const getBackButton = wrapper =>
    wrapper.find({ title: 'exit' }).find('button')

  const POSSIBLE_CHILDREN = [
    Introduction,
    DeckSetup,
    MeasureNozzle,
    TipPickUp,
    InspectingTip,
    MeasureTip,
    CompleteConfirmation,
  ]

  const SPECS: Array<CalibrateTipLengthSpec> = [
    { component: Introduction, currentStep: 'sessionStarted' },
    { component: DeckSetup, currentStep: 'labwareLoaded' },
    { component: MeasureNozzle, currentStep: 'measuringNozzleOffset' },
    { component: InspectingTip, currentStep: 'inspectingTip' },
    { component: TipPickUp, currentStep: 'preparingPipette' },
    { component: MeasureTip, currentStep: 'measuringTipOffset' },
    { component: CompleteConfirmation, currentStep: 'calibrationComplete' },
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

    render = () => {
      return mount(
        <ChecTipLengthk
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
    getRobotSessionOfType.mockReturnValue({
      id: 'fake_check_session_id',
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_CHECK,
      details: mockRobotCalibrationCheckSessionDetails,
    })
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
      getRobotSessionOfType.mockReturnValue({
        id: 'fake_check_session_id',
        sessionType: Sessions.SESSION_TYPE_CALIBRATION_CHECK,
        details: {
          ...mockRobotCalibrationCheckSessionDetails,
          currentStep: spec.currentStep,
        },
      })
      const wrapper = render()

      POSSIBLE_CHILDREN.forEach(child => {
        if (child === spec.component) {
          expect(wrapper.exists(child)).toBe(true)
        } else {
          expect(wrapper.exists(child)).toBe(false)
        }
      })
    })
  })

  it('calls deleteRobotCalibrationCheckSession on exit click', () => {
    getRobotSessionOfType.mockReturnValue({
      id: 'fake_check_session_id',
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_CHECK,
      details: mockRobotCalibrationCheckSessionDetails,
    })
    const wrapper = render()

    act(() => {
      getBackButton(wrapper).invoke('onClick')()
    })
    wrapper.update()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        ...Sessions.deleteSession('robot-name', 'fake_check_session_id'),
        meta: { requestId: expect.any(String) },
      })
    )
    expect(mockCloseCalibrationCheck).toHaveBeenCalled()
  })
})
