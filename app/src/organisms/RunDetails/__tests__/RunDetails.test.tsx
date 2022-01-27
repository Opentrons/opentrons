import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/dom'
import { Route, BrowserRouter } from 'react-router-dom'
import {
  RUN_STATUS_RUNNING,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_FAILED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import { resetAllWhenMocks, when } from 'jest-when'
import { RunDetails } from '..'
import { i18n } from '../../../i18n'
import { CommandList } from '../CommandList'
import { useProtocolDetails } from '../hooks'
import { useRunStatus, useRunControls } from '../../RunTimeControl/hooks'
import { useCloseCurrentRun } from '../../ProtocolUpload/hooks/useCloseCurrentRun'
import { ProtocolLoader } from '../../ProtocolUpload'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import type { ProtocolFile } from '@opentrons/shared-data'

jest.mock('../hooks')
jest.mock('../CommandList')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../ProtocolUpload/hooks/useCloseCurrentRun')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockCommandList = CommandList as jest.MockedFunction<typeof CommandList>

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
>
const mockUseCloseCurrentRun = useCloseCurrentRun as jest.MockedFunction<
  typeof useCloseCurrentRun
>

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolFile<{}>

const render = () => {
  return renderWithProviders(
    <BrowserRouter>
      <RunDetails />
      <Route path="/upload">Upload page</Route>
    </BrowserRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('RunDetails', () => {
  beforeEach(() => {
    when(mockUseProtocolDetails).calledWith().mockReturnValue({
      protocolData: simpleV6Protocol,
      displayName: 'mock display name',
    })
    when(mockCommandList).mockReturnValue(<div>Mock Command List</div>)
    when(mockUseCloseCurrentRun)
      .calledWith()
      .mockReturnValue({
        isProtocolRunLoaded: true,
        closeCurrentRun: jest.fn(),
      } as any)

    when(mockUseRunControls).calledWith().mockReturnValue({
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
      isPlayRunActionLoading: false,
      isPauseRunActionLoading: false,
      isStopRunActionLoading: false,
      isResetRunLoading: false,
    })
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders protocol title', () => {
    const { getByText } = render()
    getByText('Protocol - mock display name')
  })

  it('renders run detail command component', () => {
    const { getAllByText } = render()
    getAllByText('Mock Command List')
  })

  it('renders the cancel button, button is clickable, and cancel modal is rendered', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_RUNNING)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    fireEvent.click(button)
    expect(button).toBeTruthy()
    expect(getByText('Are you sure you want to cancel this run?')).toBeTruthy()
    expect(
      getByText(
        'Doing so will terminate this run, drop any attached tips in the trash container and home your robot.'
      )
    ).toBeTruthy()
    expect(
      getByText(
        'Additionally, any hardware modules used within the protocol will remain active and maintain their current states until deactivated.'
      )
    ).toBeTruthy()
    expect(getByText('no, go back')).toBeTruthy()
    expect(getByText('yes, cancel run')).toBeTruthy()
  })

  it('renders a cancel run button when the status is finishing', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_FINISHING)
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    expect(button).toBeEnabled()
  })

  it('renders a cancel run button when the status is paused', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_PAUSED)
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    expect(button).toBeEnabled()
  })

  it('renders a cancel run button when the status is pause requested', () => {
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_PAUSE_REQUESTED)
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    expect(button).toBeEnabled()
  })

  it('renders a cancel run button when the status is paused by door open', () => {
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    expect(button).toBeEnabled()
  })

  it('renders the protocol close button, button is clickable, and confirm close protocol modal is rendered when status is succeeded', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_SUCCEEDED)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'close' })
    fireEvent.click(button)
    expect(button).toBeTruthy()
    expect(
      getByText('Are you sure you want to close this protocol?')
    ).toBeTruthy()
    expect(getByText('No, go back')).toBeTruthy()
    expect(getByText('Yes, close now')).toBeTruthy()
  })

  it('renders the protocol close button, button is clickable, and confirm close protocol modal is rendered when status is failed', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_FAILED)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'close' })
    fireEvent.click(button)
    expect(button).toBeTruthy()
    expect(
      getByText('Are you sure you want to close this protocol?')
    ).toBeTruthy()
    expect(getByText('No, go back')).toBeTruthy()
    expect(getByText('Yes, close now')).toBeTruthy()
  })

  it('renders the protocol close button, button is clickable, and confirm close protocol modal is rendered when status is stopped', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_STOPPED)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'close' })
    fireEvent.click(button)
    expect(button).toBeTruthy()
    expect(
      getByText('Are you sure you want to close this protocol?')
    ).toBeTruthy()
    expect(getByText('No, go back')).toBeTruthy()
    expect(getByText('Yes, close now')).toBeTruthy()
  })

  it('renders no button in the titlebar when the run status is stop requested', () => {
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_STOP_REQUESTED)
    const { queryByRole } = render()
    const button = queryByRole('button', { name: 'close' })
    expect(button).not.toBeInTheDocument()
  })

  const renderProtocolLoader = (
    props: React.ComponentProps<typeof ProtocolLoader>
  ) => {
    return renderWithProviders(<ProtocolLoader {...props} />)[0]
  }

  let props: React.ComponentProps<typeof ProtocolLoader>
  beforeEach(() => {
    props = { loadingText: 'Loading Protocol' }
  })

  it('renders a loader if protocol run is not loaded', () => {
    when(mockUseCloseCurrentRun)
      .calledWith()
      .mockReturnValue({
        isProtocolRunLoaded: false,
        closeCurrentRun: jest.fn(),
      } as any)
    const { getByText } = renderProtocolLoader(props)
    getByText('Loading Protocol')
  })
})
