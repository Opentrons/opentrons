// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import { getRequestById } from '../../../robot-api'
import * as Sessions from '../../../sessions'
import { mockDeckCalibrationSessionAttributes } from '../../../sessions/__fixtures__'

import { CalibrateDeck } from '../index'
import { Introduction } from '../Introduction'
import { DeckSetup } from '../DeckSetup'
import { TipPickUp } from '../TipPickUp'
import { TipConfirmation } from '../TipConfirmation'
import { SaveZPoint } from '../SaveZPoint'
import { SaveXYPoint } from '../SaveXYPoint'
import { CompleteConfirmation } from '../CompleteConfirmation'

import type { State } from '../../../types'
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

const mockGetRequestById: JestMockFn<
  [State, string],
  $Call<typeof getRequestById, State, string>
> = getRequestById

describe('CalibrateDeck', () => {
  let mockStore
  let render
  let dispatch
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

    render = () => {
      return mount(
        <CalibrateDeck
          robotName="robot-name"
          session={mockDeckCalSession}
          closeWizard={() => {}}
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

  it('renders spinner when last tracked request is pending, and not present otherwise', () => {
    const wrapper = render()
    expect(wrapper.find('SpinnerModalPage').exists()).toBe(false)

    mockGetRequestById.mockReturnValue({ status: 'pending' })
    wrapper.setProps({})
    expect(wrapper.find('SpinnerModalPage').exists()).toBe(true)
  })
})
