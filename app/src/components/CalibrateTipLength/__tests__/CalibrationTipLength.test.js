// @flow
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import { mount } from 'enzyme'
import * as React from 'react'
import { Provider } from 'react-redux'

import * as Sessions from '../../../sessions'
import { mockTipLengthCalibrationSessionAttributes } from '../../../sessions/__fixtures__'
import type { TipLengthCalibrationStep } from '../../../sessions/types'
import { CompleteConfirmation } from '../CompleteConfirmation'
import { DeckSetup } from '../DeckSetup'
import { CalibrateTipLength } from '../index'
import { InspectingTip } from '../InspectingTip'
import { Introduction } from '../Introduction'
import { MeasureNozzle } from '../MeasureNozzle'
import { MeasureTip } from '../MeasureTip'
import { TipPickUp } from '../TipPickUp'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../sessions/selectors')

type CalibrateTipLengthSpec = {
  component: React.AbstractComponent<any>,
  childProps?: {},
  currentStep: TipLengthCalibrationStep,
  ...
}

// const getRobotSessionOfType: JestMockFn<
//   [State, string, Sessions.SessionType],
//   $Call<
//     typeof Sessions.getRobotSessionOfType,
//     State,
//     string,
//     Sessions.SessionType
//   >
// > = Sessions.getRobotSessionOfType

const mockGetDeckDefinitions: JestMockFn<
  [],
  $Call<typeof getDeckDefinitions, any>
> = getDeckDefinitions

describe('CalibrateTipLength', () => {
  let mockStore
  let render
  let dispatch
  let mockTipLengthSession: Sessions.TipLengthCalibrationSession = {
    id: 'fake_session_id',
    ...mockTipLengthCalibrationSessionAttributes,
  }

  // const getBackButton = wrapper =>
  //   wrapper.find({ title: 'exit' }).find('button')

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

    mockTipLengthSession = {
      id: 'fake_session_id',
      ...mockTipLengthCalibrationSessionAttributes,
    }

    render = () => {
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
      mockTipLengthSession = {
        ...mockTipLengthSession,
        details: {
          ...mockTipLengthSession.details,
          currentStep: spec.currentStep,
        },
      }
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
})
