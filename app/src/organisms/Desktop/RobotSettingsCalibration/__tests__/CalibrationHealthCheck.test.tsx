import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  ANALYTICS_CALIBRATION_HEALTH_CHECK_BUTTON_CLICKED,
  useTrackEvent,
} from '/app/redux/analytics'
import { useAttachedPipettes } from '/app/resources/instruments'
import { mockAttachedPipette } from '/app/resources/instruments/__fixtures__'
import { useRunStatuses } from '/app/resources/runs'

import { CalibrationHealthCheck } from '../CalibrationHealthCheck'

import type { ComponentProps } from 'react'
import type { AttachedPipettesByMount } from '@opentrons/api-client'

vi.mock('/app/redux/analytics')
vi.mock('/app/redux/config')
vi.mock('/app/resources/runs')
vi.mock('/app/resources/instruments')
vi.mock('/app/redux-resources/robots')

const mockAttachedPipettes: AttachedPipettesByMount = {
  left: mockAttachedPipette,
  right: mockAttachedPipette,
} as any

const RUN_STATUSES = {
  isRunRunning: false,
  isRunStill: false,
  isRunTerminal: false,
  isRunIdle: false,
}

let mockTrackEvent: any
const mockDispatchRequests = vi.fn()

const render = (
  props?: Partial<ComponentProps<typeof CalibrationHealthCheck>>
) => {
  return renderWithProviders(
    <CalibrationHealthCheck
      buttonDisabledReason={null}
      dispatchRequests={mockDispatchRequests}
      isPending={false}
      robotName="otie"
      isRobotBusy={props?.isRobotBusy ?? false}
      {...props}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CalibrationHealthCheck', () => {
  beforeEach(() => {
    mockTrackEvent = vi.fn()
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(useAttachedPipettes).mockReturnValue(mockAttachedPipettes)
    vi.mocked(useRunStatuses).mockReturnValue(RUN_STATUSES)
  })

  it('renders a title and description - Calibration Health Check section', () => {
    render()
    screen.getByText('Calibration Health Check')
    screen.getByText(
      'Check the accuracy of key calibration points without recalibrating the robot.'
    )
  })

  it('renders a Check health button', () => {
    render()
    const button = screen.getByRole('button', { name: 'Check health' })
    expect(button).not.toBeDisabled()
    fireEvent.click(button)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_CALIBRATION_HEALTH_CHECK_BUTTON_CLICKED,
      properties: {},
    })
  })

  it('Health check button is disabled when a button disabled reason is provided', () => {
    render({
      buttonDisabledReason: 'otie is unreachable',
    })
    const button = screen.getByRole('button', { name: 'Check health' })
    expect(button).toBeDisabled()
  })

  it('Health check button is disabled when a robot is running', () => {
    render({ isRobotBusy: true })
    const button = screen.getByRole('button', { name: 'Check health' })
    expect(button).toBeDisabled()
  })

  it('Health check button is disabled when pipette are not set', () => {
    vi.mocked(useAttachedPipettes).mockReturnValue({ left: null, right: null })
    render()
    const button = screen.getByRole('button', { name: 'Check health' })
    expect(button).toBeDisabled()
  })

  it('Health check button shows Tooltip when pipette are not set', async () => {
    vi.mocked(useAttachedPipettes).mockReturnValue({ left: null, right: null })
    render()
    const button = screen.getByRole('button', { name: 'Check health' })
    await userEvent.hover(button)
    await waitFor(() => {
      expect(
        screen.getByText(
          'Fully calibrate your robot before checking calibration health'
        )
      ).toBeInTheDocument()
    })
  })
})
