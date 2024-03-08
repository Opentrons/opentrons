import * as React from 'react'
import { when } from 'vitest-when'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RUN_STATUS_IDLE, RUN_STATUS_STOPPED } from '@opentrons/api-client'
import {
  useStopRunMutation,
  useDismissCurrentRunMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { useTrackProtocolRunEvent } from '../../../../organisms/Devices/hooks'
import { useRunStatus } from '../../../../organisms/RunTimeControl/hooks'
import { useTrackEvent } from '../../../../redux/analytics'
import { getLocalRobot } from '../../../../redux/discovery'
import { mockConnectedRobot } from '../../../../redux/discovery/__fixtures__'
import { ConfirmCancelRunModal } from '../ConfirmCancelRunModal'
import { CancelingRunModal } from '../CancelingRunModal'

import type { useHistory } from 'react-router-dom'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../../organisms/Devices/hooks')
vi.mock('../../../../organisms/RunTimeControl/hooks')
vi.mock('../../../../redux/analytics')
vi.mock('../../../ProtocolUpload/hooks')
vi.mock('../CancelingRunModal')
vi.mock('../../../../redux/discovery')
const mockPush = vi.fn()
const mockStopRun = vi.fn()
const mockDismissCurrentRun = vi.fn()
const mockTrackEvent = vi.fn()
const mockTrackProtocolRunEvent = vi.fn(
  () => new Promise(resolve => resolve({}))
)

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof useHistory>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof ConfirmCancelRunModal>) => {
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
  let props: React.ComponentProps<typeof ConfirmCancelRunModal>

  beforeEach(() => {
    props = {
      isActiveRun: true,
      runId: RUN_ID,
      setShowConfirmCancelRunModal: mockFn,
    }

    vi.mocked(useStopRunMutation).mockReturnValue({
      stopRun: mockStopRun,
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
    when(useRunStatus).calledWith(RUN_ID).thenReturn(RUN_STATUS_IDLE)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Are you sure you want to cancel this run?')
    screen.getByText(
      'Doing so will terminate this run, drop any attached tips in the trash container and home your robot.'
    )
    screen.getByText(
      'Additionally, any hardware modules used within the protocol will remain active and maintain their current states until deactivated.'
    )
    expect(screen.getAllByRole('button').length).toBe(2)
    screen.getByText('Go back')
    screen.getByText('Cancel run')
  })

  it('shoudler render the canceling run modal when run is dismissing', () => {
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

  it('when run is stopped, the run is dismissed and the modal closes', () => {
    when(useRunStatus).calledWith(RUN_ID).thenReturn(RUN_STATUS_STOPPED)
    render(props)

    expect(mockDismissCurrentRun).toHaveBeenCalled()
    expect(mockTrackProtocolRunEvent).toHaveBeenCalled()
  })

  it('when run is stopped, the run is dismissed and the modal closes - in prepare to run', () => {
    props = {
      ...props,
      isActiveRun: false,
    }
    when(useRunStatus).calledWith(RUN_ID).thenReturn(RUN_STATUS_STOPPED)
    render(props)

    expect(mockDismissCurrentRun).toHaveBeenCalled()
    expect(mockTrackProtocolRunEvent).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/protocols')
  })
})
