import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'

import { i18n } from '../../../i18n'
import * as Sessions from '../../../redux/sessions'
import { mockDeckCalibrationSessionAttributes } from '../../../redux/sessions/__fixtures__'

import { CalibrateDeck } from '../index'
import type { DeckCalibrationStep } from '../../../redux/sessions/types'
import type { DispatchRequestsType } from '../../../redux/robot-api'

jest.mock('@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions')
jest.mock('../../../redux/sessions/selectors')
jest.mock('../../../redux/robot-api/selectors')
jest.mock('../../../redux/config')

interface CalibrateDeckSpec {
  heading: string
  currentStep: DeckCalibrationStep
}

const mockGetDeckDefinitions = getDeckDefinitions as jest.MockedFunction<
  typeof getDeckDefinitions
>

describe('CalibrateDeck', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof CalibrateDeck>>
  ) => ReturnType<typeof renderWithProviders>
  let dispatchRequests: DispatchRequestsType
  const mockDeckCalSession: Sessions.DeckCalibrationSession = {
    id: 'fake_session_id',
    ...mockDeckCalibrationSessionAttributes,
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

    render = (props = {}) => {
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
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  SPECS.forEach(spec => {
    it(`renders correct contents when currentStep is ${spec.currentStep}`, () => {
      const { getByRole, queryByRole } = render({
        session: {
          ...mockDeckCalSession,
          details: {
            ...mockDeckCalSession.details,
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
        name: 'Deck Calibration progress will be lost',
      })
    ).toBeNull()
    getByRole('button', { name: 'Exit' }).click()
    expect(
      getByRole('heading', {
        name: 'Deck Calibration progress will be lost',
      })
    ).toBeInTheDocument()
  })

  it('does not render contents when showSpinner is true', () => {
    const { queryByRole } = render({
      showSpinner: true,
      session: {
        ...mockDeckCalSession,
        details: {
          ...mockDeckCalSession.details,
          currentStep: 'sessionStarted',
        },
      },
    })[0]
    expect(queryByRole('heading', { name: 'Before you begin' })).toBeNull()
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
      ...mockDeckCalibrationSessionAttributes,
      details: {
        ...mockDeckCalibrationSessionAttributes.details,
        currentStep: Sessions.DECK_STEP_PREPARING_PIPETTE,
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
