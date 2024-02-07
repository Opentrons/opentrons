import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import {
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { useTrackProtocolRunEvent } from '../../../organisms/Devices/hooks'
import { useTrackEvent } from '../../../redux/analytics'
import { ConfirmCancelModal } from '../../../organisms/RunDetails/ConfirmCancelModal'
import { useRunStatus } from '../../RunTimeControl/hooks'

jest.mock('@opentrons/react-api-client')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../redux/analytics')
jest.mock('../../../redux/config')

const mockUseTrackProtocolRunEvent = useTrackProtocolRunEvent as jest.MockedFunction<
  typeof useTrackProtocolRunEvent
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseStopRunMutation = useStopRunMutation as jest.MockedFunction<
  typeof useStopRunMutation
>

const render = (props: React.ComponentProps<typeof ConfirmCancelModal>) => {
  return renderWithProviders(<ConfirmCancelModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const RUN_ID = 'mockRunId'
const ROBOT_NAME = 'otie'
let mockStopRun: jest.Mock
let mockTrackEvent: jest.Mock
let mockTrackProtocolRunEvent: jest.Mock

describe('ConfirmCancelModal', () => {
  let props: React.ComponentProps<typeof ConfirmCancelModal>
  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockStopRun = jest.fn((_runId, opts) => opts.onSuccess())
    mockTrackProtocolRunEvent = jest.fn(
      () => new Promise(resolve => resolve({}))
    )
    mockUseStopRunMutation.mockReturnValue({ stopRun: mockStopRun } as any)
    mockUseRunStatus.mockReturnValue(RUN_STATUS_RUNNING)
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    when(mockUseTrackProtocolRunEvent)
      .calledWith(RUN_ID, ROBOT_NAME)
      .mockReturnValue({
        trackProtocolRunEvent: mockTrackProtocolRunEvent,
      })

    props = { onClose: jest.fn(), runId: RUN_ID, robotName: ROBOT_NAME }
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should render the correct title', () => {
    const { getByText } = render(props)
    getByText('Are you sure you want to cancel this run?')
  })
  it('should render the correct body', () => {
    const { getByText } = render(props)
    getByText(
      'Doing so will terminate this run, drop any attached tips in the trash container and home your robot.'
    )
    getByText(
      'Additionally, any hardware modules used within the protocol will remain active and maintain their current states until deactivated.'
    )
  })
  it('should render both buttons', () => {
    const { getByRole } = render(props)
    expect(props.onClose).not.toHaveBeenCalled()
    getByRole('button', { name: 'Yes, cancel run' })
    getByRole('button', { name: 'No, go back' })
  })
  it('should call yes cancel run button', () => {
    const { getByRole } = render(props)
    expect(props.onClose).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'Yes, cancel run' })
    fireEvent.click(closeButton)
    expect(mockStopRun).toHaveBeenCalled()
    expect(mockTrackProtocolRunEvent).toHaveBeenCalled()
  })
  it('should close modal if run status becomes stop-requested', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_STOP_REQUESTED)
    render(props)
    expect(props.onClose).toHaveBeenCalled()
  })
  it('should close modal if run status becomes stopped', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_STOPPED)
    render(props)
    expect(props.onClose).toHaveBeenCalled()
  })
  it('should call No go back button', () => {
    const { getByRole } = render(props)
    const closeButton = getByRole('button', { name: 'No, go back' })
    fireEvent.click(closeButton)
    expect(props.onClose).toHaveBeenCalled()
  })
})
