import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/dom'
import { Route, BrowserRouter, useHistory } from 'react-router-dom'
import { resetAllWhenMocks, when } from 'jest-when'
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
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import { RunDetails } from '..'
import { i18n } from '../../../i18n'
import { CommandList } from '../CommandList'
import { useProtocolDetails } from '../hooks'
import { getConnectedRobotName } from '../../../redux/robot/selectors'
import { useRunStatus, useRunControls } from '../../RunTimeControl/hooks'
import { ProtocolLoader } from '../../ProtocolUpload'
import {
  useCloseCurrentRun,
  useIsProtocolRunLoaded,
} from '../../ProtocolUpload/hooks'
import type { ProtocolFile } from '@opentrons/shared-data'


const mockPush = jest.fn()

jest.mock('../hooks')
jest.mock('../CommandList')
jest.mock('../../../redux/robot/selectors')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({push: mockPush } as any)
  }
})
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../ProtocolUpload/hooks/')

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
const mockUseIsProtocolRunLoaded = useIsProtocolRunLoaded as jest.MockedFunction<
  typeof useIsProtocolRunLoaded
>
const mockGetConnectedRobotName = getConnectedRobotName as jest.MockedFunction<
  typeof getConnectedRobotName
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
        isClosingCurrentRun: false,
        closeCurrentRun: jest.fn(),
      } as any)
    when(mockUseIsProtocolRunLoaded).calledWith().mockReturnValue(true)
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
    mockGetConnectedRobotName.mockReturnValue('robot_name')
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('pushes the /robots route if we somehow land on this page without a connected robot', () => {
    mockGetConnectedRobotName.mockReturnValue(null)
    render()
    expect(mockPush).toHaveBeenCalledWith('/robots')
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
    when(mockUseRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_RUNNING)
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
    when(mockUseRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_FINISHING)
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    expect(button).toBeEnabled()
  })

  it('renders a cancel run button when the status is paused', () => {
    when(mockUseRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_PAUSED)
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    expect(button).toBeEnabled()
  })

  it('renders a cancel run button when the status is pause requested', () => {
    when(mockUseRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_PAUSE_REQUESTED)
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    expect(button).toBeEnabled()
  })

  it('renders a cancel run button when the status is paused by door open', () => {
    when(mockUseRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    expect(button).toBeEnabled()
  })

  it('renders the protocol close button, button is clickable, and confirm close protocol modal is rendered when status is succeeded', () => {
    when(mockUseRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_SUCCEEDED)
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
    when(mockUseRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_FAILED)
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
    when(mockUseRunStatus)
      .calledWith(expect.any(Object))
      .mockReturnValue(RUN_STATUS_STOPPED)
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
      .calledWith(expect.any(Object))
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
    when(mockUseIsProtocolRunLoaded).calledWith().mockReturnValue(false)
    const { getByText } = renderProtocolLoader(props)
    getByText('Loading Protocol')
  })

  it('renders a loader if closing current run', () => {
    when(mockUseCloseCurrentRun).calledWith().mockReturnValue({
      closeCurrentRun: jest.fn(),
      isClosingCurrentRun: true,
    })
    const { getByText } = renderProtocolLoader(props)
    getByText('Loading Protocol')
  })
})
