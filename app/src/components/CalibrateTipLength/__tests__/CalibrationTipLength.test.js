// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import { getRequestById } from '../../../robot-api'
import * as Sessions from '../../../sessions'
import { mockTipLengthCalibrationSessionAttributes } from '../../../sessions/__fixtures__'

import { CalibrateTipLength } from '../index'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  CompleteConfirmation,
  ConfirmExitModal,
} from '../../CalibrationPanels'
import { MeasureNozzle } from '../MeasureNozzle'
import { MeasureTip } from '../MeasureTip'

import type { State } from '../../../types'
import type { TipLengthCalibrationStep } from '../../../sessions/types'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../sessions/selectors')
jest.mock('../../../robot-api/selectors')

type CalibrateTipLengthSpec = {
  component: React.AbstractComponent<any>,
  childProps?: {},
  currentStep: TipLengthCalibrationStep,
  ...
}

const mockGetDeckDefinitions: JestMockFn<
  [],
  $Call<typeof getDeckDefinitions, any>
> = getDeckDefinitions

const mockGetRequestById: JestMockFn<
  [State, string],
  $Call<typeof getRequestById, State, string>
> = getRequestById

describe('CalibrateTipLength', () => {
  let mockStore
  let render
  let dispatch
  let mockTipLengthSession: Sessions.TipLengthCalibrationSession = {
    id: 'fake_session_id',
    ...mockTipLengthCalibrationSessionAttributes,
  }

  const getExitButton = wrapper =>
    wrapper.find({ title: 'exit' }).find('button')

  const POSSIBLE_CHILDREN = [
    Introduction,
    DeckSetup,
    MeasureNozzle,
    TipPickUp,
    TipConfirmation,
    MeasureTip,
    CompleteConfirmation,
  ]

  const SPECS: Array<CalibrateTipLengthSpec> = [
    { component: Introduction, currentStep: 'sessionStarted' },
    { component: DeckSetup, currentStep: 'labwareLoaded' },
    { component: MeasureNozzle, currentStep: 'measuringNozzleOffset' },
    { component: TipPickUp, currentStep: 'preparingPipette' },
    { component: TipConfirmation, currentStep: 'inspectingTip' },
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

    render = (props = {}) => {
      const { showSpinner = false } = props
      return mount(
        <CalibrateTipLength
          robotName="robot-name"
          session={mockTipLengthSession}
          closeWizard={() => {}}
          hasBlock={true}
          dispatchRequests={jest.fn()}
          showSpinner={showSpinner}
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

  it('renders confirm exit modal on exit click', () => {
    const wrapper = render()

    expect(wrapper.find('ConfirmExitModal').exists()).toBe(false)
    act(() => getExitButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(wrapper.find('ConfirmExitModal').exists()).toBe(true)
  })

  it('does not render spinner when showSpinner is false', () => {
    const wrapper = render({ showSpinner: false })
    expect(wrapper.find('SpinnerModalPage').exists()).toBe(false)
  })

  it('renders spinner when showSpinner is true', () => {
    const wrapper = render({ showSpinner: true })
    expect(wrapper.find('SpinnerModalPage').exists()).toBe(true)
  })
})
