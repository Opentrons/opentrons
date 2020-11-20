// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import * as Sessions from '../../../sessions'
import { mockDeckCalibrationSessionAttributes } from '../../../sessions/__fixtures__'

import { CalibrateDeck } from '../index'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  SaveZPoint,
  SaveXYPoint,
  CompleteConfirmation,
} from '../../CalibrationPanels'

import type { DeckCalibrationStep } from '../../../sessions/types'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../sessions/selectors')
jest.mock('../../../robot-api/selectors')

type CalibrateDeckSpec = {
  component: React.AbstractComponent<any>,
  childProps?: {},
  currentStep: DeckCalibrationStep,
  ...
}

const mockGetDeckDefinitions: JestMockFn<
  [],
  $Call<typeof getDeckDefinitions, any>
> = getDeckDefinitions

describe('CalibrateDeck', () => {
  let mockStore
  let render
  let dispatch
  let dispatchRequests
  let mockDeckCalSession: Sessions.DeckCalibrationSession = {
    id: 'fake_session_id',
    ...mockDeckCalibrationSessionAttributes,
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
    CompleteConfirmation,
  ]

  const SPECS: Array<CalibrateDeckSpec> = [
    { component: Introduction, currentStep: 'sessionStarted' },
    { component: DeckSetup, currentStep: 'labwareLoaded' },
    { component: TipPickUp, currentStep: 'preparingPipette' },
    { component: TipConfirmation, currentStep: 'inspectingTip' },
    { component: SaveZPoint, currentStep: 'joggingToDeck' },
    { component: SaveXYPoint, currentStep: 'savingPointOne' },
    { component: SaveXYPoint, currentStep: 'savingPointTwo' },
    { component: SaveXYPoint, currentStep: 'savingPointThree' },
    { component: CompleteConfirmation, currentStep: 'calibrationComplete' },
  ]

  beforeEach(() => {
    dispatch = jest.fn()
    dispatchRequests = jest.fn()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        robotApi: {},
      }),
      dispatch,
    }
    mockGetDeckDefinitions.mockReturnValue({})

    mockDeckCalSession = {
      id: 'fake_session_id',
      ...mockDeckCalibrationSessionAttributes,
    }

    render = (props = {}) => {
      const {
        showSpinner = false,
        isJogging = false,
        session = mockDeckCalSession,
      } = props
      return mount(
        <CalibrateDeck
          robotName="robot-name"
          session={session}
          dispatchRequests={dispatchRequests}
          showSpinner={showSpinner}
          isJogging={isJogging}
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
      mockDeckCalSession = {
        ...mockDeckCalSession,
        details: {
          ...mockDeckCalSession.details,
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
  it('does dispatch jog requests when not isJogging', () => {
    const session = {
      id: 'fake_session_id',
      ...mockDeckCalibrationSessionAttributes,
      details: {
        ...mockDeckCalibrationSessionAttributes.details,
        currentStep: Sessions.DECK_STEP_PREPARING_PIPETTE,
      },
    }
    const wrapper = render({ isJogging: false, session })
    wrapper.find('button[title="forward"]').invoke('onClick')()
    expect(dispatchRequests).toHaveBeenCalledWith(
      Sessions.createSessionCommand('robot-name', session.id, {
        command: Sessions.sharedCalCommands.JOG,
        data: { vector: [0, -0.1, 0] },
      })
    )
  })

  it('does not dispatch jog requests when isJogging', () => {
    const session = {
      id: 'fake_session_id',
      ...mockDeckCalibrationSessionAttributes,
      details: {
        ...mockDeckCalibrationSessionAttributes.details,
        currentStep: Sessions.DECK_STEP_PREPARING_PIPETTE,
      },
    }
    const wrapper = render({ isJogging: true, session })
    wrapper.find('button[title="forward"]').invoke('onClick')()
    expect(dispatchRequests).not.toHaveBeenCalledWith(
      Sessions.createSessionCommand('robot-name', session.id, {
        command: Sessions.sharedCalCommands.JOG,
        data: { vector: [0, -0.1, 0] },
      })
    )
  })
})
