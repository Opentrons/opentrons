import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'
import { i18n } from '../../../i18n'
import * as Sessions from '../../../redux/sessions'
import { mockCalibrationCheckSessionAttributes } from '../../../redux/sessions/__fixtures__'

import { CheckCalibration } from '../index'
import type { RobotCalibrationCheckStep } from '../../../redux/sessions/types'

jest.mock('@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions')
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
  let render: (
    props?: Partial<React.ComponentProps<typeof CheckCalibration>>
  ) => ReturnType<typeof renderWithProviders>
  let dispatchRequests: jest.MockedFunction<any>
  const mockCalibrationCheckSession: Sessions.CalibrationCheckSession = {
    id: 'fake_check_session_id',
    ...mockCalibrationCheckSessionAttributes,
  }

  const SPECS: CheckCalibrationSpec[] = [
    { heading: 'Before you begin', currentStep: 'sessionStarted' },
    { heading: 'Prepare the space', currentStep: 'labwareLoaded' },
    { heading: 'Position pipette over A1', currentStep: 'preparingPipette' },
    {
      heading: 'Did pipette pick up tip successfully?',
      currentStep: 'inspectingTip',
    },
    { heading: 'Check z-axis on trash bin', currentStep: 'comparingHeight' },
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
    { heading: 'Return tip and continue to next pipette', currentStep: 'returningTip' },
    {
      heading: 'calibration health check results',
      currentStep: 'resultsSummary',
    },
  ]

  beforeEach(() => {
    when(mockGetDeckDefinitions).calledWith().mockReturnValue({})

    dispatchRequests = jest.fn()

    render = (
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
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  SPECS.forEach(spec => {
    it(`renders correct contents when currentStep is ${spec.currentStep}`, () => {
      const { getByRole, queryByRole } = render({
        session: {
          ...mockCalibrationCheckSession,
          details: {
            ...mockCalibrationCheckSession.details,
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
        name: 'Calibration Health Check progress will be lost',
      })
    ).toBeNull()
    getByRole('button', { name: 'Exit' }).click()
    expect(
      getByRole('heading', {
        name: 'Calibration Health Check progress will be lost',
      })
    ).toBeInTheDocument()
  })

  it('does not render contents when showSpinner is true', () => {
    const { queryByRole } = render({
      showSpinner: true,
      session: {
        ...mockCalibrationCheckSession,
        details: {
          ...mockCalibrationCheckSession.details,
          currentStep: 'sessionStarted',
        },
      },
    })[0]
    expect(queryByRole('heading', { name: 'Before you begin' })).toBeNull()
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
      ...mockCalibrationCheckSessionAttributes,
      details: {
        ...mockCalibrationCheckSessionAttributes.details,
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
