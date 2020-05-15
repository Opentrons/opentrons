// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import * as Sessions from '../../../sessions'
import * as Calibration from '../../../calibration'
import { mockRobotCalibrationCheckSessionDetails } from '../../../calibration/__fixtures__'

import { CheckCalibration } from '../index'
import { Introduction } from '../Introduction'
import { DeckSetup } from '../DeckSetup'
import { TipPickUp } from '../TipPickUp'
import { CheckXYPoint } from '../CheckXYPoint'
import { CheckHeight } from '../CheckHeight'
import { CompleteConfirmation } from '../CompleteConfirmation'

import type { State } from '../../../types'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../sessions/selectors')

type CheckCalibrationSpec = {
  component: React.AbstractComponent<any>,
  childProps?: {},
  currentStep: Calibration.RobotCalibrationCheckStep,
  ...
}
const getRobotSessionById: JestMockFn<
  [State, string, string],
  $Call<typeof Sessions.getRobotSessionById, State, string, string>
> = Sessions.getRobotSessionById

const mockGetDeckDefinitions: JestMockFn<
  [],
  $Call<typeof getDeckDefinitions, any>
> = getDeckDefinitions

describe('CheckCalibration', () => {
  let mockStore
  let render
  let dispatch

  const mockCloseCalibrationCheck = jest.fn()

  const getBackButton = wrapper =>
    wrapper.find({ title: 'exit' }).find('button')

  const POSSIBLE_CHILDREN = [
    Introduction,
    DeckSetup,
    TipPickUp,
    CheckXYPoint,
    CheckHeight,
    CompleteConfirmation,
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
    { component: CompleteConfirmation, currentStep: 'checkComplete' },
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

  it('fetches robot cal check session on mount', () => {
    getRobotSessionById.mockReturnValue({
      sessionType: Calibration.CALIBRATION_CHECK_SESSION_ID,
      details: mockRobotCalibrationCheckSessionDetails,
    })
    render()
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        ...Sessions.fetchSession(
          'robot-name',
          Calibration.CALIBRATION_CHECK_SESSION_ID
        ),
        meta: { requestId: expect.any(String) },
      })
    )
  })

  SPECS.forEach(spec => {
    it(`renders correct contents when currentStep is ${spec.currentStep}`, () => {
      getRobotSessionById.mockReturnValue({
        sessionType: Calibration.CALIBRATION_CHECK_SESSION_ID,
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
    const wrapper = render()

    act(() => {
      getBackButton(wrapper).invoke('onClick')()
    })
    wrapper.update()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        ...Sessions.deleteSession(
          'robot-name',
          Calibration.CALIBRATION_CHECK_SESSION_ID
        ),
        meta: { requestId: expect.any(String) },
      })
    )
    expect(mockCloseCalibrationCheck).toHaveBeenCalled()
  })
})
