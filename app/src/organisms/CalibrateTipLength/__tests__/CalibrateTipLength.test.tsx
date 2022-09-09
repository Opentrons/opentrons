import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'

import { i18n } from '../../../i18n'
import * as Sessions from '../../../redux/sessions'
import { mockTipLengthCalibrationSessionAttributes } from '../../../redux/sessions/__fixtures__'

import { CalibrateTipLength } from '../index'
import type { TipLengthCalibrationStep } from '../../../redux/sessions/types'

jest.mock('@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions')
jest.mock('../../../redux/sessions/selectors')
jest.mock('../../../redux/robot-api/selectors')
jest.mock('../../../redux/config')

interface CalibrateTipLengthSpec {
  heading: string
  currentStep: TipLengthCalibrationStep
}

const mockGetDeckDefinitions = getDeckDefinitions as jest.MockedFunction<
  typeof getDeckDefinitions
>

describe('CalibrateTipLength', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof CalibrateTipLength>>
  ) => ReturnType<typeof renderWithProviders>
  let dispatchRequests: jest.MockedFunction<() => {}>
  let mockTipLengthSession: Sessions.TipLengthCalibrationSession = {
    id: 'fake_session_id',
    ...mockTipLengthCalibrationSessionAttributes,
  }

  const SPECS: CalibrateTipLengthSpec[] = [
    { heading: 'Before you begin', currentStep: 'sessionStarted' },
    { heading: 'Prepare the space', currentStep: 'labwareLoaded' },
    { heading: 'Calibrate z-axis on block', currentStep: 'measuringNozzleOffset' },
    { heading: 'Position pipette over A1', currentStep: 'preparingPipette' },
    {
      heading: 'Did pipette pick up tip successfully?',
      currentStep: 'inspectingTip',
    },
    { heading: 'Calibrate tip on block', currentStep: 'measuringTipOffset' },
    {
      heading: 'Tip Length Calibration complete!',
      currentStep: 'calibrationComplete',
    },
  ]




  beforeEach(() => {
    dispatchRequests = jest.fn()
    when(mockGetDeckDefinitions).calledWith().mockReturnValue({})

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
      return renderWithProviders<React.ComponentType<typeof CalibrateTipLength>>(
        <CalibrateTipLength
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
          ...mockTipLengthSession,
          details: {
            ...mockTipLengthSession.details,
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
        name: 'Tip Length Calibration progress will be lost',
      })
    ).toBeNull()
    getByRole('button', { name: 'Exit' }).click()
    expect(
      getByRole('heading', {
        name: 'Tip Length Calibration progress will be lost',
      })
    ).toBeInTheDocument()
  })

  it('does not render contents when showSpinner is true', () => {
    const { queryByRole } = render({
      showSpinner: true,
      session: {
        ...mockTipLengthSession,
        details: {
          ...mockTipLengthSession.details,
          currentStep: 'sessionStarted',
        },
      },
    })[0]
    expect(queryByRole('heading', { name: 'Before you begin' })).toBeNull()
  })

  it('does dispatch jog requests when not isJogging', () => {
    const session = {
      id: 'fake_session_id',
      ...mockTipLengthCalibrationSessionAttributes,
      details: {
        ...mockTipLengthCalibrationSessionAttributes.details,
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
      ...mockTipLengthCalibrationSessionAttributes,
      details: {
        ...mockTipLengthCalibrationSessionAttributes.details,
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
