import * as React from 'react'
import { Provider } from 'react-redux'
import { HTMLAttributes, mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'

import * as Sessions from '../../../redux/sessions'
import { mockPipetteOffsetCalibrationSessionAttributes } from '../../../redux/sessions/__fixtures__'

import { CalibratePipetteOffset } from '../index'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  SaveZPoint,
  SaveXYPoint,
  CompleteConfirmation,
  INTENT_CALIBRATE_PIPETTE_OFFSET,
} from '../../../organisms/CalibrationPanels'

import type { PipetteOffsetCalibrationStep } from '../../../redux/sessions/types'
import type { ReactWrapper } from 'enzyme'
import type { Dispatch } from 'redux'
import { DispatchRequestsType } from '../../../redux/robot-api'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../redux/sessions/selectors')
jest.mock('../../../redux/robot-api/selectors')

interface CalibratePipetteOffsetSpec {
  component: React.ReactNode
  currentStep: PipetteOffsetCalibrationStep
}

const mockGetDeckDefinitions = getDeckDefinitions as jest.MockedFunction<
  typeof getDeckDefinitions
>

describe('CalibratePipetteOffset', () => {
  let mockStore: any
  let render: (
    props?: Partial<React.ComponentProps<typeof CalibratePipetteOffset>>
  ) => ReactWrapper<React.ComponentType<typeof CalibratePipetteOffset>>
  let dispatch: jest.MockedFunction<Dispatch>
  let dispatchRequests: DispatchRequestsType
  let mockPipOffsetCalSession: Sessions.PipetteOffsetCalibrationSession

  const getExitButton = (
    wrapper: ReturnType<typeof render>
  ): ReactWrapper<HTMLAttributes> =>
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

  const SPECS: CalibratePipetteOffsetSpec[] = [
    { component: Introduction, currentStep: 'sessionStarted' },
    { component: DeckSetup, currentStep: 'labwareLoaded' },
    { component: TipPickUp, currentStep: 'preparingPipette' },
    { component: TipConfirmation, currentStep: 'inspectingTip' },
    { component: SaveZPoint, currentStep: 'joggingToDeck' },
    { component: SaveXYPoint, currentStep: 'savingPointOne' },
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

    mockPipOffsetCalSession = {
      id: 'fake_session_id',
      ...mockPipetteOffsetCalibrationSessionAttributes,
    }

    render = (props = {}) => {
      const {
        showSpinner = false,
        isJogging = false,
        session = mockPipOffsetCalSession,
      } = props
      return mount<React.ComponentType<typeof CalibratePipetteOffset>>(
        <CalibratePipetteOffset
          robotName="robot-name"
          session={session}
          dispatchRequests={dispatchRequests}
          showSpinner={showSpinner}
          isJogging={isJogging}
          intent={INTENT_CALIBRATE_PIPETTE_OFFSET}
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
      mockPipOffsetCalSession = {
        ...mockPipOffsetCalSession,
        details: {
          ...mockPipOffsetCalSession.details,
          currentStep: spec.currentStep,
        },
      } as any
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
    act((): void =>
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
      ...mockPipetteOffsetCalibrationSessionAttributes,
      details: {
        ...mockPipetteOffsetCalibrationSessionAttributes.details,
        currentStep: Sessions.PIP_OFFSET_STEP_PREPARING_PIPETTE,
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
      ...mockPipetteOffsetCalibrationSessionAttributes,
      details: {
        ...mockPipetteOffsetCalibrationSessionAttributes.details,
        currentStep: Sessions.PIP_OFFSET_STEP_PREPARING_PIPETTE,
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
