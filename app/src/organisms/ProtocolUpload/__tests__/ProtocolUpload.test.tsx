import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import {
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FINISHING,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import {
  renderWithProviders,
  componentPropsMatcher,
} from '@opentrons/components'
import withModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/testModulesProtocol.json'

import { i18n } from '../../../i18n'
import { useTrackEvent } from '../../../redux/analytics'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import * as RobotSelectors from '../../../redux/robot/selectors'
import * as calibrationSelectors from '../../../redux/calibration/selectors'
import * as discoverySelectors from '../../../redux/discovery/selectors'
import * as protocolSelectors from '../../../redux/protocol/selectors'
import * as customLabwareSelectors from '../../../redux/custom-labware/selectors'
import * as protocolUtils from '../../../redux/protocol/utils'
import { ConfirmCancelModal } from '../../RunDetails/ConfirmCancelModal'
import { useProtocolDetails } from '../../RunDetails/hooks'
import { ConfirmExitProtocolUploadModal } from '../ConfirmExitProtocolUploadModal'
import { mockCalibrationStatus } from '../../../redux/calibration/__fixtures__'
import { useRunStatus, useRunControls } from '../../RunTimeControl/hooks'
import { useCreateRun } from '../hooks/useCreateRun'
import { useCurrentProtocol } from '../hooks/useCurrentProtocol'
import { useCloseCurrentRun } from '../hooks/useCloseCurrentRun'
import { UploadInput } from '../UploadInput'
import { ProtocolUpload, ProtocolLoader } from '..'

jest.mock('../../../redux/protocol/selectors')
jest.mock('../../../redux/analytics')
jest.mock('../../../redux/protocol/utils')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../../../redux/calibration/selectors')
jest.mock('../../../redux/custom-labware/selectors')
jest.mock('../../RunDetails/hooks')
jest.mock('../hooks/useCurrentProtocol')
jest.mock('../hooks/useCreateRun')
jest.mock('../hooks/useCloseCurrentRun')
jest.mock('../ConfirmExitProtocolUploadModal')
jest.mock('../../../redux/robot/selectors')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../RunDetails/ConfirmCancelModal')
jest.mock('../UploadInput')

const getProtocolFile = protocolSelectors.getProtocolFile as jest.MockedFunction<
  typeof protocolSelectors.getProtocolFile
>
const ingestProtocolFile = protocolUtils.ingestProtocolFile as jest.MockedFunction<
  typeof protocolUtils.ingestProtocolFile
>
const getConnectedRobot = discoverySelectors.getConnectedRobot as jest.MockedFunction<
  typeof discoverySelectors.getConnectedRobot
>
const getCalibrationStatus = calibrationSelectors.getCalibrationStatus as jest.MockedFunction<
  typeof calibrationSelectors.getCalibrationStatus
>
const mockConfirmExitProtocolUploadModal = ConfirmExitProtocolUploadModal as jest.MockedFunction<
  typeof ConfirmExitProtocolUploadModal
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
>
const mockUseCurrentProtocol = useCurrentProtocol as jest.MockedFunction<
  typeof useCurrentProtocol
>
const mockUseCreateRun = useCreateRun as jest.MockedFunction<
  typeof useCreateRun
>
const mockUseCloseProtocolRun = useCloseCurrentRun as jest.MockedFunction<
  typeof useCloseCurrentRun
>
const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockConfirmCancelModal = ConfirmCancelModal as jest.MockedFunction<
  typeof ConfirmCancelModal
>
const mockUploadInput = UploadInput as jest.MockedFunction<typeof UploadInput>
const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
>
const mockGetValidCustomLabwareFiles = customLabwareSelectors.getValidCustomLabwareFiles as jest.MockedFunction<
  typeof customLabwareSelectors.getValidCustomLabwareFiles
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

const queryClient = new QueryClient()

const render = () => {
  return renderWithProviders(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProtocolUpload />
      </BrowserRouter>
    </QueryClientProvider>,
    { i18nInstance: i18n }
  )
}

const mockLoadingText = 'mockLoadingText'
let mockTrackEvent: jest.Mock

describe('ProtocolUpload', () => {
  beforeEach(() => {
    getProtocolFile.mockReturnValue(null)
    getConnectedRobot.mockReturnValue(mockConnectedRobot)
    getCalibrationStatus.mockReturnValue(mockCalibrationStatus)
    ingestProtocolFile.mockImplementation((_f, _s, _e) => {})
    mockGetConnectedRobotName.mockReturnValue('robotName')
    mockGetValidCustomLabwareFiles.mockReturnValue({} as any)
    when(mockConfirmExitProtocolUploadModal)
      .calledWith(
        componentPropsMatcher({
          exit: expect.anything(),
          back: expect.anything(),
        })
      )
      .mockImplementation(({ exit }) => (
        <div onClick={exit}>mock confirm exit protocol upload modal</div>
      ))
    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({} as any)
    when(mockUseCloseProtocolRun).calledWith().mockReturnValue({
      closeCurrentRun: jest.fn(),
      isProtocolRunLoaded: true,
    })
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_IDLE)
    when(mockUseRunControls)
      .calledWith()
      .mockReturnValue({ pause: jest.fn() } as any)
    mockTrackEvent = jest.fn()
    when(mockUseTrackEvent).calledWith().mockReturnValue(mockTrackEvent)
    when(mockUploadInput).mockReturnValue(<div></div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('renders Protocol Upload Input for empty state', () => {
    when(mockUseCurrentProtocol).calledWith().mockReturnValue(null)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    when(mockUseCloseProtocolRun).calledWith().mockReturnValue({
      closeCurrentRun: jest.fn(),
      isProtocolRunLoaded: false,
    })
    mockGetConnectedRobotName.mockReturnValue(null)
    const { queryByText } = render()[0]
    expect(queryByText('Organization/Author')).toBeNull()
  })
  it('renders Protocol Setup if file loaded', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({ data: { analyses: [] } } as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    const { queryByRole, getByText } = render()[0]
    expect(queryByRole('button', { name: 'Choose File...' })).toBeNull()
    expect(getByText('Organization/Author')).toBeTruthy()
  })

  it('opens up the confirm close protocol modal when clicked', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({} as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    const { getByRole, getByText } = render()[0]

    fireEvent.click(getByRole('button', { name: 'close' }))
    getByText('mock confirm exit protocol upload modal')
  })

  it('closes the confirm close protocol modal when Yes, close now is clicked', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({} as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    const mockCloseCurrentRun = jest.fn()
    when(mockUseCloseProtocolRun).calledWith().mockReturnValue({
      closeCurrentRun: mockCloseCurrentRun,
      isProtocolRunLoaded: true,
    })

    const [{ getByRole, getByText }] = render()
    fireEvent.click(getByRole('button', { name: 'close' }))
    const mockCloseModal = getByText('mock confirm exit protocol upload modal')
    fireEvent.click(mockCloseModal)
    expect(
      screen.queryByText('mock confirm exit protocol upload modal')
    ).toBeNull()
    expect(mockCloseCurrentRun).toHaveBeenCalled()
  })

  it('calls ingest protocol if handleUpload', () => {
    when(mockUseCurrentProtocol).calledWith().mockReturnValue(null)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    when(mockUseCloseProtocolRun).calledWith().mockReturnValue({
      closeCurrentRun: jest.fn(),
      isProtocolRunLoaded: false,
    })

    const { getByText } = render()[0]
    getByText('Open a protocol to run on robotName')
  })

  it('renders empty state input if the current run is being closed or has a not-ok status', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({} as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    const mockCloseCurrentRun = jest.fn()
    when(mockUseCloseProtocolRun).calledWith().mockReturnValue({
      closeCurrentRun: mockCloseCurrentRun,
      isProtocolRunLoaded: false,
    })

    const [{ getByText }] = render()
    getByText('Open a protocol to run on robotName')
  })

  it('renders the cancel button, button is clickable, and cancel modal is rendered when run status is running', () => {
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({ data: { analyses: [] } } as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_RUNNING)
    when(mockConfirmCancelModal).mockReturnValue(
      <div>mock confirm cancel modal</div>
    )
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    fireEvent.click(button)
    expect(screen.queryByText('mock confirm cancel modal')).not.toBeNull()
  })

  it('renders the cancel button, button is clickable, and cancel modal is rendered when run status is paused', () => {
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({ data: { analyses: [] } } as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_PAUSED)
    when(mockConfirmCancelModal).mockReturnValue(
      <div>mock confirm cancel modal</div>
    )
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    fireEvent.click(button)
    expect(screen.queryByText('mock confirm cancel modal')).not.toBeNull()
  })

  it('renders the cancel button, button is clickable, and cancel modal is rendered when run status is pause requested', () => {
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({ data: { analyses: [] } } as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_PAUSE_REQUESTED)
    when(mockConfirmCancelModal).mockReturnValue(
      <div>mock confirm cancel modal</div>
    )
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    fireEvent.click(button)
    expect(screen.queryByText('mock confirm cancel modal')).not.toBeNull()
  })

  it('renders the cancel button, button is clickable, and cancel modal is rendered when run status is blocked by open door', () => {
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({ data: { analyses: [] } } as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
    when(mockConfirmCancelModal).mockReturnValue(
      <div>mock confirm cancel modal</div>
    )
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    fireEvent.click(button)
    expect(screen.queryByText('mock confirm cancel modal')).not.toBeNull()
  })

  it('renders the cancel button, button is clickable, and cancel modal is rendered when run status is finishing', () => {
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({ data: { analyses: [] } } as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_FINISHING)
    when(mockConfirmCancelModal).mockReturnValue(
      <div>mock confirm cancel modal</div>
    )
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    fireEvent.click(button)
    expect(screen.queryByText('mock confirm cancel modal')).not.toBeNull()
  })
  it('renders protocol title', () => {
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({ data: { analyses: [withModulesProtocol] } } as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    mockUseProtocolDetails.mockReturnValue({
      displayName: 'mock protocol name',
    } as any)
    const [{ getByText }] = render()
    getByText('Protocol - mock protocol name')
  })

  it('renders only the protocol title with no button when run status is stop requested', () => {
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({ data: { analyses: [] } } as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_STOP_REQUESTED)
    when(mockConfirmCancelModal).mockReturnValue(
      <div>mock confirm cancel modal</div>
    )
    expect(screen.queryByText('mock confirm cancel modal')).toBeNull()
    expect(screen.queryByText('Cancel Run')).toBeNull()
  })

  it('renders an error if protocol has a not-ok result', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({
        data: {
          analyses: [
            {
              result: 'not-ok',
              errors: [
                {
                  detail: 'FAKE ERROR',
                },
              ],
            },
          ],
        },
      } as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: null,
    })
    const mockCloseCurrentRun = jest.fn()
    when(mockUseCloseProtocolRun).calledWith().mockReturnValue({
      closeCurrentRun: mockCloseCurrentRun,
      isProtocolRunLoaded: false,
    })

    const [{ getByText }] = render()
    getByText('FAKE ERROR')
  })
  it('renders an error if the protocol is invalid', () => {
    when(mockUseCurrentProtocol)
      .calledWith()
      .mockReturnValue({} as any)
    when(mockUseCreateRun).calledWith().mockReturnValue({
      createProtocolRun: jest.fn(),
      isCreatingProtocolRun: false,
      protocolCreationError: 'invalid protocol!',
    })
    const [{ getByText }] = render()
    getByText('Protocol upload failed. Fix the error and try again')
    getByText('invalid protocol!')
  })
})

const renderProtocolLoader = (
  props: React.ComponentProps<typeof ProtocolLoader>
) => {
  return renderWithProviders(<ProtocolLoader {...props} />)[0]
}

describe('ProtocolLoader', () => {
  let props: React.ComponentProps<typeof ProtocolLoader>
  beforeEach(() => {
    props = { loadingText: mockLoadingText }
  })

  it('should render ProtocolLoader text with spinner', () => {
    const { getByText } = renderProtocolLoader(props)
    getByText('mockLoadingText')
  })
})
