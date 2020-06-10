// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import * as Sessions from '../../../sessions'
import * as Calibration from '../../../calibration'
import { mockTipLengthCalibrationSessionAttributes } from '../../../sessions/__fixtures__'
import { mockTipLengthCalibrationSessionDetails } from '../../../calibration/__fixtures__'

import { CalibrateTipLength } from '../index'
import { Introduction } from '../Introduction'
import { DeckSetup } from '../DeckSetup'
import { MeasureNozzle } from '../MeasureNozzle'
import { TipPickUp } from '../TipPickUp'
import { InspectingTip } from '../InspectingTip'
import { MeasureTip } from '../MeasureTip'
import { CompleteConfirmation } from '../CompleteConfirmation'

import type { State } from '../../../types'
import { SESSION_TYPE_TIP_LENGTH_CALIBRATION } from '../../../sessions'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../sessions/selectors')

type CalibrateTipLengthSpec = {
  component: React.AbstractComponent<any>,
  childProps?: {},
  currentStep: Calibration.TipLengthCalibrationStep,
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

const mockGetDeckDefinitions: JestMockFn<
  [],
  $Call<typeof getDeckDefinitions, any>
> = getDeckDefinitions

describe('CalibrateTipLength', () => {
  let mockStore
  let render
  let dispatch
  let mockTipLengthSession: Sessions.TipLengthCalibrationSession | null = null

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

    render = (
      currentStep: Calibration.TipLengthCalibrationStep = 'sessionStarted'
    ) => {
      mockTipLengthSession = {
        id: 'fake_session_id',
        ...mockTipLengthCalibrationSessionAttributes,
        details: {
          ...mockTipLengthCalibrationSessionAttributes.details,
          currentStep,
        },
      }
      return mount(
        <CalibrateTipLength
          robotName="robot-name"
          session={mockTipLengthSession}
          mount="left"
          isMulti
          probed
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

  SPECS.forEach(spec => {
    it(`renders correct contents when currentStep is ${spec.currentStep}`, () => {
      const wrapper = render(spec.currentStep)

      POSSIBLE_CHILDREN.forEach(child => {
        if (child === spec.component) {
          expect(wrapper.exists(child)).toBe(true)
        } else {
          expect(wrapper.exists(child)).toBe(false)
        }
      })
    })
  })
})
