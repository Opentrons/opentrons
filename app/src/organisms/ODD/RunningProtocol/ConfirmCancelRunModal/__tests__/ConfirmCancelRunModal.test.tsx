import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { RUN_STATUS_IDLE, RUN_STATUS_STOPPED } from '@opentrons/api-client'
import {
  useDeleteRunMutation,
  useDismissCurrentRunMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackProtocolRunEvent } from '/app/redux-resources/analytics'
import { useTrackEvent } from '/app/redux/analytics'
import { getLocalRobot } from '/app/redux/discovery'
import { mockConnectedRobot } from '/app/redux/discovery/__fixtures__'
import { useNotifyRunQuery } from '/app/resources/runs'

import { CancelingRunModal } from '../../CancelingRunModal'
import { ConfirmCancelRunModal } from '../../ConfirmCancelRunModal'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/runs')
vi.mock('/app/redux-resources/analytics')
vi.mock('/app/redux/analytics')
vi.mock('../../CancelingRunModal')
vi.mock('/app/redux/discovery')
const mockNavigate = vi.fn()
const mockStopRun = vi.fn()
const mockDeleteRun = vi.fn()
const mockDismissCurrentRun = vi.fn()
const mockTrackEvent = vi.fn()
const mockTrackProtocolRunEvent = vi.fn(
  () => new Promise(resolve => resolve({}))
)

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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
    mockNavigate.mockClear()
    mockStopRun.mockClear()
    mockDeleteRun.mockClear()
    mockDismissCurrentRun.mockClear()
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
    vi.mocked(useDeleteRunMutation).mockReturnValue({
      deleteRun: mockDeleteRun,
    } as any)
    vi.mocked(useDismissCurrentRunMutation).mockReturnValue({
      dismissCurrentRun: mockDismissCurrentRun,
      isLoading: false,
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

    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          status: RUN_STATUS_IDLE,
        },
      },
    } as any)
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

  it('should render the canceling run modal when run is dismissing', () => {
    vi.mocked(useDismissCurrentRunMutation).mockReturnValue({
      dismissCurrentRun: mockDismissCurrentRun,
      isLoading: true,
    } as any)
    render(props)
    screen.getByText('mock CancelingRunModal')
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

  it('when tapping cancel run with error, should remain in canceling state', () => {
    mockStopRun.mockImplementation((_id: string, options: any) => {
      options.onError()
    })

    render(props)
    const button = screen.getByText('Cancel run')
    fireEvent.click(button)

    screen.getByText('mock CancelingRunModal')
  })

  it('when stop run succeeds and run is not active, run is dismissed and navigates to /protocols', () => {
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
    expect(mockDismissCurrentRun).toHaveBeenCalledWith(RUN_ID)
    expect(mockNavigate).toHaveBeenCalledWith('/protocols')
  })

  it('when stop run succeeds with protocolId, navigates to protocol-specific page', () => {
    props = {
      ...props,
      isActiveRun: false,
      protocolId: 'test-protocol-id',
    }

    mockStopRun.mockImplementation((_id: string, options: any) => {
      options.onSuccess()
    })

    render(props)
    const button = screen.getByText('Cancel run')
    fireEvent.click(button)

    expect(mockDismissCurrentRun).toHaveBeenCalledWith(RUN_ID)
    expect(mockTrackProtocolRunEvent).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/protocols/test-protocol-id')
  })

  it('when run is active, stop run does not dismiss or navigate', () => {
    mockStopRun.mockImplementation((_id: string, options: any) => {
      options.onSuccess()
    })

    render(props)
    const button = screen.getByText('Cancel run')
    fireEvent.click(button)

    expect(mockDismissCurrentRun).not.toHaveBeenCalled()
    expect(mockTrackProtocolRunEvent).toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('when stop run errors and run is not active, still dismisses and navigates', () => {
    props = {
      ...props,
      isActiveRun: false,
    }

    mockStopRun.mockImplementation((_id: string, options: any) => {
      options.onError()
    })

    render(props)
    const button = screen.getByText('Cancel run')
    fireEvent.click(button)

    expect(mockDismissCurrentRun).toHaveBeenCalledWith(RUN_ID)
    expect(mockNavigate).toHaveBeenCalledWith('/protocols')
    expect(mockTrackProtocolRunEvent).not.toHaveBeenCalled()
  })

  it('when run status becomes stopped via polling, run is dismissed and navigates to /protocols', () => {
    props = {
      ...props,
      isActiveRun: false,
    }

    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          status: RUN_STATUS_STOPPED,
        },
      },
    } as any)

    render(props)

    expect(mockDismissCurrentRun).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/protocols')
  })

  it('when run status becomes stopped via polling with protocolId, navigates to protocol-specific page', () => {
    props = {
      ...props,
      isActiveRun: false,
      protocolId: 'test-protocol-id',
    }

    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          status: RUN_STATUS_STOPPED,
        },
      },
    } as any)

    render(props)

    expect(mockDismissCurrentRun).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/protocols/test-protocol-id')
  })

  it('when run status becomes stopped via polling and run is active, run is not dismissed', () => {
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          status: RUN_STATUS_STOPPED,
        },
      },
    } as any)

    render(props)

    expect(mockDismissCurrentRun).not.toHaveBeenCalled()
  })
})
