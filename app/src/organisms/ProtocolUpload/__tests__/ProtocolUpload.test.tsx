import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { fireEvent, screen } from '@testing-library/react'
import {
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
import { useCurrentProtocolRun } from '../hooks/useCurrentProtocolRun'
import { useCloseCurrentRun } from '../hooks/useCloseCurrentRun'
import { ProtocolUpload } from '..'

jest.mock('../../../redux/protocol/selectors')
jest.mock('../../../redux/protocol/utils')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../../../redux/calibration/selectors')
jest.mock('../../../redux/custom-labware/selectors')
jest.mock('../../RunDetails/hooks')
jest.mock('../hooks/useCurrentProtocolRun')
jest.mock('../hooks/useCloseCurrentRun')
jest.mock('../ConfirmExitProtocolUploadModal')
jest.mock('../../../redux/robot/selectors')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../RunDetails/ConfirmCancelModal')

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
const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
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
const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
>
const mockGetValidCustomLabwareFiles = customLabwareSelectors.getValidCustomLabwareFiles as jest.MockedFunction<
  typeof customLabwareSelectors.getValidCustomLabwareFiles
>

const queryClient = new QueryClient()

const render = () => {
  return renderWithProviders(
    <QueryClientProvider client={queryClient}>
      <ProtocolUpload />
    </QueryClientProvider>,
    { i18nInstance: i18n }
  )
}

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
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('renders Protocol Upload Input for empty state', () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: null,
        runRecord: null,
        createProtocolRun: jest.fn(),
      } as any)
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
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: { data: { analyses: [] } },
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
    const { queryByRole, getByText } = render()[0]
    expect(queryByRole('button', { name: 'Choose File...' })).toBeNull()
    expect(getByText('Organization/Author')).toBeTruthy()
  })

  it('opens up the confirm close protocol modal when clicked', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: {},
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
    const { getByRole, getByText } = render()[0]

    fireEvent.click(getByRole('button', { name: 'close' }))
    getByText('mock confirm exit protocol upload modal')
  })

  it('closes the confirm close protocol modal when Yes, close now is clicked', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: {},
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
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
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: null,
        runRecord: null,
        createProtocolRun: jest.fn(),
      } as any)
    when(mockUseCloseProtocolRun).calledWith().mockReturnValue({
      closeCurrentRun: jest.fn(),
      isProtocolRunLoaded: false,
    })

    const { getByText } = render()[0]
    getByText('Open a protocol to run on robotName')
  })

  it('renders empty state input if the current run is being closed or has a not-ok status', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: {},
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
    const mockCloseCurrentRun = jest.fn()
    when(mockUseCloseProtocolRun).calledWith().mockReturnValue({
      closeCurrentRun: mockCloseCurrentRun,
      isProtocolRunLoaded: false,
    })

    const [{ getByText }] = render()
    getByText('Open a protocol to run on robotName')
  })

  it('renders the cancel button, button is clickable, and cancel modal is rendered when run status is running', () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: { data: { analyses: [] } },
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
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
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: { data: { analyses: [] } },
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
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
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: { data: { analyses: [] } },
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
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

  it('renders the cancel button, button is clickable, and cancel modal is rendered when run status is finishing', () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: { data: { analyses: [] } },
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_FINISHING)
    when(mockConfirmCancelModal).mockReturnValue(
      <div>mock confirm cancel modal</div>
    )
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Cancel Run' })
    fireEvent.click(button)
    expect(screen.queryByText('mock confirm cancel modal')).not.toBeNull()
  })

  it('renders only the protocol title with no button when run status is stop requested', () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: { data: { analyses: [] } },
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_STOP_REQUESTED)
    when(mockConfirmCancelModal).mockReturnValue(
      <div>mock confirm cancel modal</div>
    )
    expect(screen.queryByText('mock confirm cancel modal')).toBeNull()
  })

  it('renders an error if protocol has a not-ok result', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: {
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
        },
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
    const mockCloseCurrentRun = jest.fn()
    when(mockUseCloseProtocolRun).calledWith().mockReturnValue({
      closeCurrentRun: mockCloseCurrentRun,
      isProtocolRunLoaded: false,
    })

    const [{ getByText }] = render()
    getByText('FAKE ERROR')
  })
  it('renders an error if the protocol is invalid', () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: {},
        runRecord: {},
        createProtocolRun: jest.fn(),
        protocolCreationError: 'invalid protocol!',
      } as any)
    const [{ getByText }] = render()
    getByText('Protocol upload failed. Fix the error and try again')
    getByText('invalid protocol!')
  })
})
