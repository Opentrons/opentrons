// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import * as Sessions from '../../../sessions'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import { CheckHealthCalibration } from '../index'
import { BadCalibration } from '../BadCalibration'
import { ResultsSummary } from '../ResultsSummary'
import { ReturnTip } from '../ReturnTip'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  SaveXYPoint,
  SaveZPoint,
} from '../../CalibrationPanels'

import { mockCalibrationCheckSessionAttributes } from '../../../sessions/__fixtures__'

import type { RobotCalibrationCheckStep } from '../../../sessions/types'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../calibration/selectors')

type CheckCalibrationSpec = {
  component: React.AbstractComponent<any>,
  childProps?: {},
  currentStep: RobotCalibrationCheckStep,
  ...
}

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
  const getExitButton = wrapper =>
    wrapper.find({ title: 'exit' }).find('button')

  const POSSIBLE_CHILDREN = [
    Introduction,
    DeckSetup,
    TipPickUp,
    TipConfirmation,
    SaveZPoint,
    SaveXYPoint,
    ResultsSummary,
    BadCalibration,
  ]

  const SPECS: Array<CheckCalibrationSpec> = [
    { component: Introduction, currentStep: 'sessionStarted' },
    { component: DeckSetup, currentStep: 'labwareLoaded' },
    { component: TipPickUp, currentStep: 'preparingPipette' },
    { component: TipConfirmation, currentStep: 'inspectingTip' },
    { component: SaveZPoint, currentStep: 'comparingHeight' },
    { component: SaveXYPoint, currentStep: 'comparingPointOne' },
    { component: SaveXYPoint, currentStep: 'comparingPointTwo' },
    { component: SaveXYPoint, currentStep: 'comparingPointThree' },
    { component: ReturnTip, currentStep: 'returningTip' },
    { component: ResultsSummary, currentStep: 'resultsSummary' },
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

    render = (props = {}) => {
      const { showSpinner = false } = props
      return mount(
        <CheckHealthCalibration
          robotName="robot-name"
          session={mockCalibrationCheckSession}
          dispatchRequests={jest.fn()}
          showSpinner={showSpinner}
          hasBlock={false}
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
      mockCalibrationCheckSession = {
        ...mockCalibrationCheckSession,
        details: {
          ...mockCalibrationCheckSession.details,
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
