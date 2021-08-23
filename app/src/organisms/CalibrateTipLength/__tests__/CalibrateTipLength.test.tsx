import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'

import * as Sessions from '../../../redux/sessions'
import { mockTipLengthCalibrationSessionAttributes } from '../../../redux/sessions/__fixtures__'

import { CalibrateTipLength } from '../index'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  CompleteConfirmation,
  MeasureNozzle,
  MeasureTip,
} from '../../../organisms/CalibrationPanels'

import type { TipLengthCalibrationStep } from '../../../redux/sessions/types'
import type { ReactWrapper } from 'enzyme'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../redux/sessions/selectors')
jest.mock('../../../redux/robot-api/selectors')

interface CalibrateTipLengthSpec {
  component: React.ComponentType<any>
  currentStep: TipLengthCalibrationStep
}

const mockGetDeckDefinitions = getDeckDefinitions as jest.MockedFunction<
  typeof getDeckDefinitions
>

type Wrapper = ReactWrapper<React.ComponentProps<typeof CalibrateTipLength>>

describe('CalibrateTipLength', () => {
  let mockStore: any
  let render: (
    props?: Partial<React.ComponentProps<typeof CalibrateTipLength>>
  ) => Wrapper
  let dispatch: jest.MockedFunction<() => {}>
  let dispatchRequests: jest.MockedFunction<() => {}>
  let mockTipLengthSession: Sessions.TipLengthCalibrationSession = {
    id: 'fake_session_id',
    ...mockTipLengthCalibrationSessionAttributes,
  }

  const getExitButton = (wrapper: Wrapper) =>
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

  const SPECS: CalibrateTipLengthSpec[] = [
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
    dispatchRequests = jest.fn()
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
      const {
        showSpinner = false,
        isJogging = false,
        session = mockTipLengthSession,
      } = props
      return mount(
        <CalibrateTipLength
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
    act(() =>
      getExitButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    )
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
      ...mockTipLengthCalibrationSessionAttributes,
      details: {
        ...mockTipLengthCalibrationSessionAttributes.details,
        currentStep: Sessions.TIP_LENGTH_STEP_PREPARING_PIPETTE,
      },
    }
    const wrapper = render({ isJogging: false, session })
    wrapper.find('button[title="forward"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
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
      ...mockTipLengthCalibrationSessionAttributes,
      details: {
        ...mockTipLengthCalibrationSessionAttributes.details,
        currentStep: Sessions.TIP_LENGTH_STEP_PREPARING_PIPETTE,
      },
    }
    const wrapper = render({ isJogging: true, session })
    wrapper.find('button[title="forward"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    expect(dispatchRequests).not.toHaveBeenCalledWith(
      Sessions.createSessionCommand('robot-name', session.id, {
        command: Sessions.sharedCalCommands.JOG,
        data: { vector: [0, -0.1, 0] },
      })
    )
  })
})
