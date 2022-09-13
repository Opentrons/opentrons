import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'

import { i18n } from '../../../i18n'
import * as Sessions from '../../../redux/sessions'
import { mockPipetteOffsetCalibrationSessionAttributes } from '../../../redux/sessions/__fixtures__'

import { CalibratePipetteOffset } from '../index'
import type { PipetteOffsetCalibrationStep } from '../../../redux/sessions/types'
import { DispatchRequestsType } from '../../../redux/robot-api'

jest.mock('@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions')
jest.mock('../../../redux/sessions/selectors')
jest.mock('../../../redux/robot-api/selectors')
jest.mock('../../../redux/config')

interface CalibratePipetteOffsetSpec {
  heading: string
  currentStep: PipetteOffsetCalibrationStep
}

const mockGetDeckDefinitions = getDeckDefinitions as jest.MockedFunction<
  typeof getDeckDefinitions
>

describe('CalibratePipetteOffset', () => {
  let dispatchRequests: DispatchRequestsType
  let render: (
    props?: Partial<React.ComponentProps<typeof CalibratePipetteOffset>>
  ) => ReturnType<typeof renderWithProviders>
  let mockPipOffsetCalSession: Sessions.PipetteOffsetCalibrationSession
  const SPECS: CalibratePipetteOffsetSpec[] = [
    { heading: 'Before you begin', currentStep: 'sessionStarted' },
    { heading: 'Prepare the space', currentStep: 'labwareLoaded' },
    { heading: 'Position pipette over A1', currentStep: 'preparingPipette' },
    {
      heading: 'Did pipette pick up tip successfully?',
      currentStep: 'inspectingTip',
    },
    { heading: 'Calibrate z-axis in slot 5', currentStep: 'joggingToDeck' },
    {
      heading: 'Calibrate x- and y-axis in slot 1',
      currentStep: 'savingPointOne',
    },
    {
      heading: 'Pipette Offset Calibration complete!',
      currentStep: 'calibrationComplete',
    },
  ]

  beforeEach(() => {
    dispatchRequests = jest.fn()
    when(mockGetDeckDefinitions).calledWith().mockReturnValue({})

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
      return renderWithProviders<
        React.ComponentType<typeof CalibratePipetteOffset>
      >(
        <CalibratePipetteOffset
          robotName="robot-name"
          session={session}
          dispatchRequests={dispatchRequests}
          showSpinner={showSpinner}
          isJogging={isJogging}
        />,
        { i18nInstance: i18n }
      )
    }
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  SPECS.forEach(spec => {
    it(`renders correct contents when currentStep is ${spec.currentStep}`, () => {
      const { getByRole, queryByRole } = render({
        session: {
          ...mockPipOffsetCalSession,
          details: {
            ...mockPipOffsetCalSession.details,
            currentStep: spec.currentStep,
          },
        },
      })[0]

      SPECS.forEach(({ currentStep, heading }) => {
        if (currentStep === spec.currentStep) {
          expect(
            getByRole('heading', { name: spec.heading })
          ).toBeInTheDocument()
        } else {
          expect(queryByRole('heading', { name: heading })).toBeNull()
        }
      })
    })
  })

  it('renders confirm exit on exit click', () => {
    const { getByRole, queryByRole } = render()[0]

    expect(
      queryByRole('heading', {
        name: 'Pipette Offset Calibration progress will be lost',
      })
    ).toBeNull()
    getByRole('button', { name: 'Exit' }).click()
    expect(
      getByRole('heading', {
        name: 'Pipette Offset Calibration progress will be lost',
      })
    ).toBeInTheDocument()
  })

  it('does not render contents when showSpinner is true', () => {
    const { queryByRole } = render({
      showSpinner: true,
      session: {
        ...mockPipOffsetCalSession,
        details: {
          ...mockPipOffsetCalSession.details,
          currentStep: 'sessionStarted',
        },
      },
    })[0]
    expect(queryByRole('heading', { name: 'Before you begin' })).toBeNull()
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
    const { getByRole } = render({ isJogging: false, session })[0]
    getByRole('button', { name: 'forward' }).click()
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
    const { getByRole } = render({ isJogging: true, session })[0]
    getByRole('button', { name: 'forward' }).click()
    expect(dispatchRequests).not.toHaveBeenCalledWith(
      Sessions.createSessionCommand('robot-name', session.id, {
        command: Sessions.sharedCalCommands.JOG,
        data: { vector: [0, -0.1, 0] },
      })
    )
  })
})
