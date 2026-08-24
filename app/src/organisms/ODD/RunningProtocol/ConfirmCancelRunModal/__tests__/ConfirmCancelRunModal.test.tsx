import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useStopRunMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackProtocolRunEvent } from '/app/redux-resources/analytics'
import { useTrackEvent } from '/app/redux/analytics'
import { getLocalRobot } from '/app/redux/discovery'
import { mockConnectedRobot } from '/app/redux/discovery/__fixtures__'

import { CancelingRunModal } from '../../CancelingRunModal'
import { ConfirmCancelRunModal } from '../../ConfirmCancelRunModal'

import type { ComponentProps } from 'react'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/analytics')
vi.mock('/app/redux/analytics')
vi.mock('../../CancelingRunModal')
vi.mock('/app/redux/discovery')
const mockStopRun = vi.fn()
const mockTrackEvent = vi.fn()
const mockTrackProtocolRunEvent = vi.fn(
  () => new Promise(resolve => resolve({}))
)

const render = (props: ComponentProps<typeof ConfirmCancelRunModal>) => {
  return renderWithProviders(
    <MemoryRouter>
      <ConfirmCancelRunModal {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const RUN_ID = 'mock_runID'
const ROBOT_NAME = 'otie'

const mockFn = vi.fn()

describe('ConfirmCancelRunModal', () => {
  let props: ComponentProps<typeof ConfirmCancelRunModal>

  beforeEach(() => {
    mockStopRun.mockClear()
    mockTrackEvent.mockClear()
    mockTrackProtocolRunEvent.mockClear()
    mockFn.mockClear()

    props = {
      isActiveRun: true,
      runId: RUN_ID,
      setShowConfirmCancelRunModal: mockFn,
    }

    vi.mocked(useStopRunMutation).mockReturnValue({
      stopRun: mockStopRun,
    } as any)
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    when(useTrackProtocolRunEvent).calledWith(RUN_ID, ROBOT_NAME).thenReturn({
      trackProtocolRunEvent: mockTrackProtocolRunEvent,
    })
    vi.mocked(CancelingRunModal).mockReturnValue(
      <div>mock CancelingRunModal</div>
    )

    vi.mocked(getLocalRobot).mockReturnValue({
      ...mockConnectedRobot,
      name: ROBOT_NAME,
    })
  })

  it('should render correct text and buttons', () => {
    render(props)
    screen.getByText('Are you sure you want to cancel?')
    screen.getByText('Doing so will terminate this run and home your robot.')
    screen.getByText(
      'Additionally, any hardware modules used within the protocol will remain active and maintain their current states until deactivated.'
    )
    expect(screen.getAllByRole('button').length).toBe(2)
    screen.getByText('Go back')
    screen.getByText('Cancel run')
  })

  it('when tapping go back, the mock function is called', () => {
    render(props)
    const button = screen.getByText('Go back')
    fireEvent.click(button)
    expect(mockFn).toHaveBeenCalled()
  })

  it('when tapping cancel run, the run is stopped', () => {
    render(props)
    const button = screen.getByText('Cancel run')
    fireEvent.click(button)
    expect(mockStopRun).toHaveBeenCalled()
  })

  it('when tapping cancel run, should show the canceling run modal', () => {
    render(props)
    const button = screen.getByText('Cancel run')
    fireEvent.click(button)
    screen.getByText('mock CancelingRunModal')
  })

  it('when tapping cancel run with error, should remain in canceling state', () => {
    mockStopRun.mockImplementation((_id: string, options: any) => {
      options.onError()
    })

    render(props)
    const button = screen.getByText('Cancel run')
    fireEvent.click(button)

    screen.getByText('mock CancelingRunModal')
  })

  it('when stop run succeeds, tracks cancel and does not navigate', () => {
    mockStopRun.mockImplementation((_id: string, options: any) => {
      options.onSuccess()
    })

    render(props)
    const button = screen.getByText('Cancel run')
    fireEvent.click(button)

    expect(mockTrackProtocolRunEvent).toHaveBeenCalledWith({
      name: 'runCancel',
    })
    screen.getByText('mock CancelingRunModal')
  })

  it('when stop run succeeds and run is not active, still only stops', () => {
    props = {
      ...props,
      isActiveRun: false,
    }

    mockStopRun.mockImplementation((_id: string, options: any) => {
      options.onSuccess()
    })

    render(props)
    const button = screen.getByText('Cancel run')
    fireEvent.click(button)

    expect(mockTrackProtocolRunEvent).toHaveBeenCalledWith({
      name: 'runCancel',
    })
    expect(mockStopRun).toHaveBeenCalledWith(RUN_ID, expect.any(Object))
    screen.getByText('mock CancelingRunModal')
  })
})
