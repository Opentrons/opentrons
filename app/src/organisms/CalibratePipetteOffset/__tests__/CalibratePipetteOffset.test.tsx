import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import * as Sessions from '../../../redux/sessions'
import { mockPipetteOffsetCalibrationSessionAttributes } from '../../../redux/sessions/__fixtures__'

import { CalibratePipetteOffset } from '../index'
import type { PipetteOffsetCalibrationStep } from '../../../redux/sessions/types'
import { DispatchRequestsType } from '../../../redux/robot-api'
import { fireEvent, screen } from '@testing-library/react'

jest.mock('@opentrons/shared-data')
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
  const render = (
    props: Partial<React.ComponentProps<typeof CalibratePipetteOffset>> = {}
  ) => {
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
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  SPECS.forEach(spec => {
    it(`renders correct contents when currentStep is ${spec.currentStep}`, () => {
      render({
        session: {
          ...mockPipOffsetCalSession,
          details: {
            ...mockPipOffsetCalSession.details,
            currentStep: spec.currentStep,
          },
        },
      })

      SPECS.forEach(({ currentStep, heading }) => {
        if (currentStep === spec.currentStep) {
          expect(
            screen.getByRole('heading', { name: spec.heading })
          ).toBeInTheDocument()
        } else {
          expect(screen.queryByRole('heading', { name: heading })).toBeNull()
        }
      })
    })
  })

  it('renders confirm exit on exit click', () => {
    render()
    expect(
      screen.queryByRole('heading', {
        name: 'Pipette Offset Calibration progress will be lost',
      })
    ).toBeNull()
    const exitButton = screen.getByRole('button', { name: 'Exit' })
    fireEvent.click(exitButton)
    expect(
      screen.getByRole('heading', {
        name: 'Pipette Offset Calibration progress will be lost',
      })
    ).toBeInTheDocument()
  })

  it('does not render contents when showSpinner is true', () => {
    render({
      showSpinner: true,
      session: {
        ...mockPipOffsetCalSession,
        details: {
          ...mockPipOffsetCalSession.details,
          currentStep: 'sessionStarted',
        },
      },
    })
    expect(
      screen.queryByRole('heading', { name: 'Before you begin' })
    ).toBeNull()
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
    render({ isJogging: false, session })
    const forwardButton = screen.getByRole('button', { name: 'forward' })
    fireEvent.click(forwardButton)
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
    render({ isJogging: true, session })
    const forwardButton = screen.getByRole('button', { name: 'forward' })
    fireEvent.click(forwardButton)
    expect(dispatchRequests).not.toHaveBeenCalledWith(
      Sessions.createSessionCommand('robot-name', session.id, {
        command: Sessions.sharedCalCommands.JOG,
        data: { vector: [0, -0.1, 0] },
      })
    )
  })
})
