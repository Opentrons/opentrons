import * as React from 'react'
import '@testing-library/jest-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  useModuleMatchResults,
  useProtocolCalibrationStatus,
} from '../../ProtocolSetup/RunSetupCard/hooks'
import {
  useRunCompleteTime,
  useRunControls,
  useRunStartTime,
  useRunStatus,
} from '../hooks'
import { Timer } from '../Timer'
import { RunTimeControl } from '..'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Tooltip: jest.fn(({ children }) => <div>{children}</div>),
  }
})
jest.mock('../hooks')
jest.mock('../Timer')
jest.mock('../../ProtocolSetup/RunSetupCard/hooks')

const mockUseRunCompleteTime = useRunCompleteTime as jest.MockedFunction<
  typeof useRunCompleteTime
>
const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
>
const mockUseRunStartTime = useRunStartTime as jest.MockedFunction<
  typeof useRunStartTime
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockTimer = Timer as jest.MockedFunction<typeof Timer>

const mockUseModuleMatchResults = useModuleMatchResults as jest.MockedFunction<
  typeof useModuleMatchResults
>
const mockUseProtocolCalibrationStatus = useProtocolCalibrationStatus as jest.MockedFunction<
  typeof useProtocolCalibrationStatus
>

const render = () => {
  return renderWithProviders(<RunTimeControl />, { i18nInstance: i18n })
}

describe('RunTimeControl', () => {
  beforeEach(() => {
    when(mockUseRunControls)
      .calledWith()
      .mockReturnValue({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_IDLE)
    mockTimer.mockReturnValue(<div>Mock Timer</div>)
    when(mockUseRunCompleteTime).calledWith().mockReturnValue(null)
    mockUseProtocolCalibrationStatus.mockReturnValue({
      complete: true,
    })
    mockUseModuleMatchResults.mockReturnValue({
      missingModuleIds: [],
      remainingAttachedModules: [],
    })
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders a header', () => {
    const [{ getByText }] = render()

    expect(getByText('Run Protocol')).toBeTruthy()
  })

  it('renders a run status but no timer if idle and run unstarted', () => {
    const [{ getByRole, getByText, queryByText }] = render()

    expect(getByText('Status: Not started')).toBeTruthy()
    expect(queryByText('Mock Timer')).toBeNull()
    expect(getByRole('button', { name: 'Start Run' })).toBeTruthy()
  })
  it('should render disabled button with tooltip if calibration is incomplete', () => {
    mockUseProtocolCalibrationStatus.mockReturnValue({
      complete: false,
    } as any)
    const [{ getByRole, getByText }] = render()
    const button = getByRole('button', { name: 'Start Run' })
    expect(button).toBeDisabled()
    getByText('Complete required steps on Protocol tab before starting the run')
  })
  it('should render disabled button with tooltip if a module is missing', () => {
    mockUseModuleMatchResults.mockReturnValue({
      missingModuleIds: ['temperatureModuleV1'],
      remainingAttachedModules: [],
    })
    const [{ getByRole, getByText }] = render()
    const button = getByRole('button', { name: 'Start Run' })
    expect(button).toBeDisabled()
    getByText('Complete required steps on Protocol tab before starting the run')
  })
  it('should render disabled button if play run action is loading', () => {
    when(mockUseRunControls)
      .calledWith()
      .mockReturnValue({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: true,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Start Run' })
    expect(button).toBeDisabled()
  })
  it('should render disabled button if pause run action is loading', () => {
    when(mockUseRunControls)
      .calledWith()
      .mockReturnValue({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: true,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_RUNNING)
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Pause Run' })
    expect(button).toBeDisabled()
  })
  it('should render disabled button if reset run action is loading', () => {
    when(mockUseRunControls)
      .calledWith()
      .mockReturnValue({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: true,
      })
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_SUCCEEDED)
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Run Again' })
    expect(button).toBeDisabled()
  })

  it('should render a disabled Run Again button if run status is stop requested', () => {
    when(mockUseRunControls)
      .calledWith()
      .mockReturnValue({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: true,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_STOP_REQUESTED)
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Run Again' })
    expect(button).toBeDisabled()
  })

  it('should render an enabled Run Again button if run is completed', () => {
    when(mockUseRunControls)
      .calledWith()
      .mockReturnValue({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_SUCCEEDED)
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Run Again' })
    expect(button).toBeEnabled()
  })

  it('should render an enabled Run Again button if run is canceled', () => {
    when(mockUseRunControls)
      .calledWith()
      .mockReturnValue({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_STOPPED)
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Run Again' })
    expect(button).toBeEnabled()
  })

  it('renders a run status and timer if running', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_RUNNING)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Running')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Pause Run' })).toBeTruthy()
  })

  it('renders a run status and timer if paused', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_PAUSED)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Paused')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Resume Run' })).toBeTruthy()
  })

  it('renders a run status and timer if pause-requested', () => {
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_PAUSE_REQUESTED)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Pause requested')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Resume Run' })).toBeTruthy()
  })

  it('renders a run status and timer if stop-requested', () => {
    when(mockUseRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_STOP_REQUESTED)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')
    const [{ getByRole, getByText, queryByText }] = render()

    expect(getByText('Status: Stop requested')).toBeTruthy()
    expect(queryByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Run Again' })).toBeTruthy()
  })

  it('renders a run status and timer if stopped', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_STOPPED)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')
    when(mockUseRunCompleteTime).calledWith().mockReturnValue('noon thirty')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Canceled')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Run Again' })).toBeTruthy()
  })

  it('renders a run status and timer if failed', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_FAILED)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')
    when(mockUseRunCompleteTime).calledWith().mockReturnValue('noon thirty')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Completed')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Run Again' })).toBeTruthy()
  })

  it('renders a run status and timer if succeeded', () => {
    when(mockUseRunStatus).calledWith().mockReturnValue(RUN_STATUS_SUCCEEDED)
    when(mockUseRunStartTime).calledWith().mockReturnValue('noon')
    when(mockUseRunCompleteTime).calledWith().mockReturnValue('noon thirty')

    const [{ getByRole, getByText }] = render()

    expect(getByText('Status: Completed')).toBeTruthy()
    expect(getByText('Mock Timer')).toBeTruthy()
    expect(getByRole('button', { name: 'Run Again' })).toBeTruthy()
  })
})
