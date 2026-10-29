import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { RUN_STATUS_STOPPED } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useIsFlex } from '/app/redux-resources/robots'
import {
  ANALYTICS_PROCEED_TO_MODULE_SETUP_STEP,
  useTrackEvent,
} from '/app/redux/analytics'
import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useNotifyRunQuery,
  useRunHasStarted,
} from '/app/resources/runs'

import { SetupInstrumentCalibration } from '../SetupInstrumentCalibration'
import { SetupRobotCalibration } from '../SetupRobotCalibration'

import type { ComponentProps } from 'react'

vi.mock('/app/redux/analytics')
vi.mock('../../hooks')
vi.mock('/app/resources/runs')
vi.mock('/app/redux-resources/robots')
vi.mock('../SetupInstrumentCalibration')

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

describe('SetupRobotCalibration', () => {
  const mockExpandStep = vi.fn()
  const mockTrackEvent = vi.fn()

  const render = ({
    robotName = ROBOT_NAME,
    runId = RUN_ID,
    nextStep = 'module_setup_step',
    calibrationStatus = { complete: true },
    expandStep = mockExpandStep,
  }: Partial<ComponentProps<typeof SetupRobotCalibration>> = {}) => {
    return renderWithProviders(
      <SetupRobotCalibration
        {...{
          robotName,
          runId,
          nextStep,
          calibrationStatus,
          expandStep,
        }}
      />,
      { i18nInstance: i18n }
    )
  }

  beforeEach(() => {
    when(vi.mocked(useTrackEvent)).calledWith().thenReturn(mockTrackEvent)
    vi.mocked(SetupInstrumentCalibration).mockReturnValue(
      <div>Mock SetupInstrumentCalibration</div>
    )
    when(vi.mocked(useRunHasStarted)).calledWith(RUN_ID).thenReturn(false)
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(false)
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID, { refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL })
      .thenReturn({
        data: {
          data: {
            id: RUN_ID,
            status: RUN_STATUS_STOPPED,
            errors: [],
          },
        },
      } as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders only pipette calibration component', () => {
    render()
    screen.getByText('Mock SetupInstrumentCalibration')
  })

  it('changes Proceed CTA copy based on next step', () => {
    render({ nextStep: 'labware_liquids_setup_step' })
    screen.getByRole('button', { name: 'Proceed to labware & liquids' })
  })

  it('calls the expandStep function and tracks the analytics event on click', () => {
    render()
    fireEvent.click(
      screen.getByRole('button', { name: 'Proceed to deck hardware' })
    )
    expect(mockExpandStep).toHaveBeenCalled()
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROCEED_TO_MODULE_SETUP_STEP,
      properties: {},
    })
  })

  it('does not call the expandStep function on click if calibration is not complete', () => {
    render({ calibrationStatus: { complete: false } })
    const button = screen.getByRole('button', {
      name: 'Proceed to deck hardware',
    })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(mockExpandStep).not.toHaveBeenCalled()
  })

  it('does not call the expandStep function on click if run has started', () => {
    when(vi.mocked(useRunHasStarted)).calledWith(RUN_ID).thenReturn(true)
    render()
    const button = screen.getByRole('button', {
      name: 'Proceed to deck hardware',
    })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(mockExpandStep).not.toHaveBeenCalled()
  })
})
