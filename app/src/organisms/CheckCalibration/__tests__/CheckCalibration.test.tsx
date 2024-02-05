import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import * as Sessions from '../../../redux/sessions'
import { mockCalibrationCheckSessionAttributes } from '../../../redux/sessions/__fixtures__'

import { CheckCalibration } from '../index'
import type { RobotCalibrationCheckStep } from '../../../redux/sessions/types'

jest.mock('@opentrons/shared-data')
jest.mock('../../../redux/calibration/selectors')
jest.mock('../../../redux/config')

interface CheckCalibrationSpec {
  heading: string
  currentStep: RobotCalibrationCheckStep
}

const mockGetDeckDefinitions = getDeckDefinitions as jest.MockedFunction<
  typeof getDeckDefinitions
>

describe('CheckCalibration', () => {
  const dispatchRequests = jest.fn()
  const mockCalibrationCheckSession: Sessions.CalibrationCheckSession = {
    id: 'fake_check_session_id',
    ...mockCalibrationCheckSessionAttributes,
  }

  const render = (
    props: Partial<React.ComponentProps<typeof CheckCalibration>> = {}
  ) => {
    const {
      showSpinner = false,
      isJogging = false,
      session = mockCalibrationCheckSession,
    } = props
    return renderWithProviders<React.ComponentType<typeof CheckCalibration>>(
      <CheckCalibration
        robotName="robot-name"
        session={session}
        dispatchRequests={dispatchRequests}
        showSpinner={showSpinner}
        hasBlock={false}
        isJogging={isJogging}
      />,
      { i18nInstance: i18n }
    )
  }

  const SPECS: CheckCalibrationSpec[] = [
    { heading: 'Before you begin', currentStep: 'sessionStarted' },
    { heading: 'Prepare the space', currentStep: 'labwareLoaded' },
    { heading: 'Position pipette over A1', currentStep: 'preparingPipette' },
    {
      heading: 'Did pipette pick up tip successfully?',
      currentStep: 'inspectingTip',
    },
    { heading: 'Check z-axis on slot 5', currentStep: 'comparingHeight' },
    {
      heading: 'Check x- and y-axis in slot 1',
      currentStep: 'comparingPointOne',
    },
    {
      heading: 'Check x- and y-axis in slot 3',
      currentStep: 'comparingPointTwo',
    },
    {
      heading: 'Check x- and y-axis in slot 7',
      currentStep: 'comparingPointThree',
    },
    {
      heading: 'Return tip and continue to next pipette',
      currentStep: 'returningTip',
    },
    {
      heading: 'Calibration Health Check Results',
      currentStep: 'resultsSummary',
    },
  ]

  beforeEach(() => {
    when(mockGetDeckDefinitions).calledWith().mockReturnValue({})
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  SPECS.forEach(spec => {
    it(`renders correct contents when currentStep is ${spec.currentStep}`, () => {
      render({
        session: {
          ...mockCalibrationCheckSession,
          details: {
            ...mockCalibrationCheckSession.details,
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
        name: 'Calibration Health Check progress will be lost',
      })
    ).toBeNull()
    const button = screen.getByRole('button', { name: 'Exit' })
    fireEvent.click(button)
    expect(
      screen.getByRole('heading', {
        name: 'Calibration Health Check progress will be lost',
      })
    ).toBeInTheDocument()
  })

  it('does not render contents when showSpinner is true', () => {
    render({
      showSpinner: true,
      session: {
        ...mockCalibrationCheckSession,
        details: {
          ...mockCalibrationCheckSession.details,
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
      ...mockCalibrationCheckSessionAttributes,
      details: {
        ...mockCalibrationCheckSessionAttributes.details,
        currentStep: Sessions.DECK_STEP_PREPARING_PIPETTE,
      },
    }
    render({ isJogging: false, session })
    const button = screen.getByRole('button', { name: 'forward' })
    fireEvent.click(button)
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
      ...mockCalibrationCheckSessionAttributes,
      details: {
        ...mockCalibrationCheckSessionAttributes.details,
        currentStep: Sessions.DECK_STEP_PREPARING_PIPETTE,
      },
    }
    render({ isJogging: true, session })
    const button = screen.getByRole('button', { name: 'forward' })
    fireEvent.click(button)
    expect(dispatchRequests).not.toHaveBeenCalledWith(
      Sessions.createSessionCommand('robot-name', session.id, {
        command: Sessions.sharedCalCommands.JOG,
        data: { vector: [0, -0.1, 0] },
      })
    )
  })
})
