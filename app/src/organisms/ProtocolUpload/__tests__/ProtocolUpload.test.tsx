import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { fireEvent, screen } from '@testing-library/react'
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
import * as protocolUtils from '../../../redux/protocol/utils'
import { useProtocolDetails } from '../../RunDetails/hooks'
import { ConfirmExitProtocolUploadModal } from '../ConfirmExitProtocolUploadModal'
import { mockCalibrationStatus } from '../../../redux/calibration/__fixtures__'
import { useCurrentProtocolRun } from '../hooks/useCurrentProtocolRun'
import { useCloseCurrentRun } from '../hooks/useCloseCurrentRun'
import { closeProtocol } from '../../../redux/protocol/actions'
import { ProtocolUpload } from '..'

jest.mock('../../../redux/protocol/selectors')
jest.mock('../../../redux/protocol/utils')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../../../redux/calibration/selectors')
jest.mock('../../RunDetails/hooks')
jest.mock('../hooks/useCurrentProtocolRun')
jest.mock('../hooks/useCloseCurrentRun')
jest.mock('../ConfirmExitProtocolUploadModal')
jest.mock('../../../redux/robot/selectors')

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
const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
>
const mockUseCloseProtocolRun = useCloseCurrentRun as jest.MockedFunction<
  typeof useCloseCurrentRun
>
const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
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
    when(mockUseCloseProtocolRun)
      .calledWith()
      .mockReturnValue({closeCurrentRun: mockCloseCurrentRun, isClosingCurrentRun: false})

    const [{ getByRole, getByText }, store] = render()
    fireEvent.click(getByRole('button', { name: 'close' }))
    const mockCloseModal = getByText('mock confirm exit protocol upload modal')
    fireEvent.click(mockCloseModal)
    expect(
      screen.queryByText('mock confirm exit protocol upload modal')
    ).toBeNull()
    expect(store.dispatch).toHaveBeenCalledWith(closeProtocol())
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
    const { getByText } = render()[0]
    getByText('Open a protocol to run on robotName')
  })

  it('renders empty state input if the current run is being closed', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        protocolRecord: {},
        runRecord: {},
        createProtocolRun: jest.fn(),
      } as any)
    const mockCloseCurrentRun = jest.fn()
    when(mockUseCloseProtocolRun)
      .calledWith()
      .mockReturnValue({closeCurrentRun: mockCloseCurrentRun, isClosingCurrentRun: true})

    const [{getByText }] = render()
    getByText('Open a protocol to run on robotName')
  })
})
