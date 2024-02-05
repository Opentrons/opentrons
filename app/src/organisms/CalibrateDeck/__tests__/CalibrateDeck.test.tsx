import * as React from 'react'
import * as Vitest from 'vitest'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Sessions from '../../../redux/sessions'
import { mockDeckCalibrationSessionAttributes } from '../../../redux/sessions/__fixtures__'
import { getDeckDefinitions } from '@opentrons/shared-data'

import { CalibrateDeck } from '../index'
import type { DeckCalibrationStep } from '../../../redux/sessions/types'
import type { DispatchRequestsType } from '../../../redux/robot-api'

vi.mock('../../../redux/sessions/selectors')
vi.mock('../../../redux/robot-api/selectors')
vi.mock('../../../redux/config')

interface CalibrateDeckSpec {
  heading: string
  currentStep: DeckCalibrationStep
}

const mockGetDeckDefinitions = getDeckDefinitions as Vitest.MockedFunction<
  typeof getDeckDefinitions
>

describe('CalibrateDeck', () => {
  let dispatchRequests: DispatchRequestsType
  const mockDeckCalSession: Sessions.DeckCalibrationSession = {
    id: 'fake_session_id',
    ...mockDeckCalibrationSessionAttributes,
  }
  const render = (
    props: Partial<React.ComponentProps<typeof CalibrateDeck>> = {}
  ) => {
    const {
      showSpinner = false,
      isJogging = false,
      session = mockDeckCalSession,
    } = props
    return renderWithProviders<React.ComponentType<typeof CalibrateDeck>>(
      <CalibrateDeck
        robotName="robot-name"
        session={session}
        dispatchRequests={dispatchRequests}
        showSpinner={showSpinner}
        isJogging={isJogging}
      />,
      { i18nInstance: i18n }
    )
  }

  const SPECS: CalibrateDeckSpec[] = [
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
      heading: 'Calibrate x- and y-axis in slot 3',
      currentStep: 'savingPointTwo',
    },
    {
      heading: 'Calibrate x- and y-axis in slot 7',
      currentStep: 'savingPointThree',
    },
    {
      heading: 'Deck Calibration complete!',
      currentStep: 'calibrationComplete',
    },
  ]

  beforeEach(() => {
    dispatchRequests = jest.fn()
    when(mockGetDeckDefinitions).calledWith().mockReturnValue({})
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  SPECS.forEach(spec => {
    it(`renders correct contents when currentStep is ${spec.currentStep}`, () => {
      render({
        session: {
          ...mockDeckCalSession,
          details: {
            ...mockDeckCalSession.details,
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
        name: 'Deck Calibration progress will be lost',
      })
    ).toBeNull()
    const exitButton = screen.getByRole('button', { name: 'Exit' })
    fireEvent.click(exitButton)
    expect(
      screen.getByRole('heading', {
        name: 'Deck Calibration progress will be lost',
      })
    ).toBeInTheDocument()
  })

  it('does not render contents when showSpinner is true', () => {
    render({
      showSpinner: true,
      session: {
        ...mockDeckCalSession,
        details: {
          ...mockDeckCalSession.details,
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
      ...mockDeckCalibrationSessionAttributes,
      details: {
        ...mockDeckCalibrationSessionAttributes.details,
        currentStep: Sessions.DECK_STEP_PREPARING_PIPETTE,
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
      ...mockDeckCalibrationSessionAttributes,
      details: {
        ...mockDeckCalibrationSessionAttributes.details,
        currentStep: Sessions.DECK_STEP_PREPARING_PIPETTE,
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
