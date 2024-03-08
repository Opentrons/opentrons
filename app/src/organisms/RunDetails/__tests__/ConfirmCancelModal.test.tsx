import * as React from 'react'
import { when } from 'vitest-when'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import {
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { useTrackProtocolRunEvent } from '../../../organisms/Devices/hooks'
import { useTrackEvent } from '../../../redux/analytics'
import { renderWithProviders } from '../../../__testing-utils__'
import { ConfirmCancelModal } from '../../../organisms/RunDetails/ConfirmCancelModal'
import { useRunStatus } from '../../RunTimeControl/hooks'
import type * as ApiClient from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ApiClient>()
  return {
    ...actual,
    useStopRunMutation: vi.fn(),
  }
})
vi.mock('../../RunTimeControl/hooks')
vi.mock('../../../organisms/Devices/hooks')
vi.mock('../../../redux/analytics')
vi.mock('../../../redux/config')

const render = (props: React.ComponentProps<typeof ConfirmCancelModal>) => {
  return renderWithProviders(<ConfirmCancelModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const RUN_ID = 'mockRunId'
let mockStopRun: any
let mockTrackEvent: any
let mockTrackProtocolRunEvent: any
const ROBOT_NAME = 'otie'

describe('ConfirmCancelModal', () => {
  let props: React.ComponentProps<typeof ConfirmCancelModal>
  beforeEach(() => {
    mockTrackEvent = vi.fn()
    mockStopRun = vi.fn((_runId, opts) => opts.onSuccess())
    mockTrackProtocolRunEvent = vi.fn(() => new Promise(resolve => resolve({})))
    vi.mocked(useStopRunMutation).mockReturnValue({
      stopRun: mockStopRun,
    } as any)
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_RUNNING)
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    when(useTrackProtocolRunEvent).calledWith(RUN_ID, ROBOT_NAME).thenReturn({
      trackProtocolRunEvent: mockTrackProtocolRunEvent,
    })

    props = { onClose: vi.fn(), runId: RUN_ID, robotName: ROBOT_NAME }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render the correct title', () => {
    render(props)
    screen.getByText('Are you sure you want to cancel this run?')
  })
  it('should render the correct body', () => {
    render(props)
    screen.getByText(
      'Doing so will terminate this run, drop any attached tips in the trash container and home your robot.'
    )
    screen.getByText(
      'Additionally, any hardware modules used within the protocol will remain active and maintain their current states until deactivated.'
    )
  })
  it('should render both buttons', () => {
    render(props)
    expect(props.onClose).not.toHaveBeenCalled()
    screen.getByRole('button', { name: 'Yes, cancel run' })
    screen.getByRole('button', { name: 'No, go back' })
  })
  it('should call yes cancel run button', () => {
    render(props)
    expect(props.onClose).not.toHaveBeenCalled()
    const closeButton = screen.getByRole('button', { name: 'Yes, cancel run' })
    fireEvent.click(closeButton)
    expect(mockStopRun).toHaveBeenCalled()
    expect(mockTrackProtocolRunEvent).toHaveBeenCalled()
  })
  it('should close modal if run status becomes stop-requested', () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_STOP_REQUESTED)
    render(props)
    expect(props.onClose).toHaveBeenCalled()
  })
  it('should close modal if run status becomes stopped', () => {
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_STOPPED)
    render(props)
    expect(props.onClose).toHaveBeenCalled()
  })
  it('should call No go back button', () => {
    render(props)
    const closeButton = screen.getByRole('button', { name: 'No, go back' })
    fireEvent.click(closeButton)
    expect(props.onClose).toHaveBeenCalled()
  })
})
