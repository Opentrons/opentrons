import * as React from 'react'
import { i18n } from '../../../../../i18n'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  RobotUpdateProgressModal,
  TIME_BEFORE_ALLOWING_EXIT,
  TIME_BEFORE_ALLOWING_EXIT_INIT,
} from '../RobotUpdateProgressModal'
import { useRobotUpdateInfo } from '../useRobotUpdateInfo'
import {
  getRobotSessionIsManualFile,
  getRobotUpdateDownloadError,
} from '../../../../../redux/robot-update'
import { useDispatchStartRobotUpdate } from '../../../../../redux/robot-update/hooks'
import {
  useRobotInitializationStatus,
  INIT_STATUS,
} from '../../../../../resources/health/hooks'

import type { SetStatusBarCreateCommand } from '@opentrons/shared-data'
import type { RobotUpdateSession } from '../../../../../redux/robot-update/types'

jest.mock('@opentrons/react-api-client')
jest.mock('../useRobotUpdateInfo')
jest.mock('../../../../../redux/robot-update')
jest.mock('../../../../../redux/robot-update/hooks')
jest.mock('../../../../../resources/health/hooks')

const mockUseCreateLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseRobotUpdateInfo = useRobotUpdateInfo as jest.MockedFunction<
  typeof useRobotUpdateInfo
>
const mockGetRobotSessionIsManualFile = getRobotSessionIsManualFile as jest.MockedFunction<
  typeof getRobotSessionIsManualFile
>
const mockUseDispatchStartRobotUpdate = useDispatchStartRobotUpdate as jest.MockedFunction<
  typeof useDispatchStartRobotUpdate
>
const mockGetRobotUpdateDownloadError = getRobotUpdateDownloadError as jest.MockedFunction<
  typeof getRobotUpdateDownloadError
>
const mockUseRobotInitializationStatus = useRobotInitializationStatus as jest.MockedFunction<
  typeof useRobotInitializationStatus
>

const render = (
  props: React.ComponentProps<typeof RobotUpdateProgressModal>
) => {
  return renderWithProviders(<RobotUpdateProgressModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DownloadUpdateModal', () => {
  const mockRobotUpdateSession: RobotUpdateSession | null = {
    robotName: 'testRobot',
    fileInfo: null,
    token: null,
    pathPrefix: null,
    step: 'getToken',
    stage: 'validating',
    progress: 50,
    error: null,
  }

  let props: React.ComponentProps<typeof RobotUpdateProgressModal>
  const mockCreateLiveCommand = jest.fn()

  beforeEach(() => {
    mockCreateLiveCommand.mockResolvedValue(null)
    props = {
      robotName: 'testRobot',
      session: mockRobotUpdateSession,
      closeUpdateBuildroot: jest.fn(),
    }
    mockUseCreateLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    mockUseRobotUpdateInfo.mockReturnValue({
      updateStep: 'install',
      progressPercent: 50,
    })
    mockGetRobotSessionIsManualFile.mockReturnValue(false)
    mockUseDispatchStartRobotUpdate.mockReturnValue(jest.fn)
    mockGetRobotUpdateDownloadError.mockReturnValue(null)
    mockUseRobotInitializationStatus.mockReturnValue(INIT_STATUS.SUCCEEDED)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders robot update download errors', () => {
    mockGetRobotUpdateDownloadError.mockReturnValue('test download error')
    render(props)
    screen.getByText('test download error')
  })

  it('renders the robot name as a part of the header', () => {
    render(props)
    expect(screen.getByText('Updating testRobot')).toBeInTheDocument()
  })

  it('activates the Update animation when first rendered', () => {
    render(props)
    const updatingCommand: SetStatusBarCreateCommand = {
      commandType: 'setStatusBar',
      params: { animation: 'updating' },
    }
    expect(mockUseCreateLiveCommandMutation).toBeCalledWith()
    expect(mockCreateLiveCommand).toBeCalledWith({
      command: updatingCommand,
      waitUntilComplete: false,
    })
  })

  it('renders the correct text when installing the robot update with no close button', () => {
    render(props)
    expect(screen.getByText('Installing update...')).toBeInTheDocument()
    expect(
      screen.getByText(
        "This could take up to 15 minutes. Don't turn off the robot."
      )
    ).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the correct text when finalizing the robot update with no close button', () => {
    mockUseRobotUpdateInfo.mockReturnValue({
      updateStep: 'restart',
      progressPercent: 100,
    })
    render(props)

    expect(
      screen.getByText('Install complete, robot restarting...')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "This could take up to 15 minutes. Don't turn off the robot."
      )
    ).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a success modal and exit button upon finishing the update process', () => {
    mockUseRobotUpdateInfo.mockReturnValue({
      updateStep: 'finished',
      progressPercent: 100,
    })
    render(props)

    const exitButton = screen.getByText('exit')

    expect(
      screen.getByText('Robot software successfully updated')
    ).toBeInTheDocument()
    expect(exitButton).toBeInTheDocument()
    expect(mockCreateLiveCommand).toBeCalledTimes(1)
    fireEvent.click(exitButton)
    expect(props.closeUpdateBuildroot).toHaveBeenCalled()
  })

  it('renders an error modal and exit button if an error occurs', () => {
    props = {
      ...props,
      session: {
        ...mockRobotUpdateSession,
        error: 'test error',
      },
    }
    const idleCommand: SetStatusBarCreateCommand = {
      commandType: 'setStatusBar',
      params: { animation: 'idle' },
    }

    render(props)
    const exitButton = screen.getByText('exit')

    expect(screen.getByText('test error')).toBeInTheDocument()
    fireEvent.click(exitButton)
    expect(props.closeUpdateBuildroot).toHaveBeenCalled()

    expect(mockUseCreateLiveCommandMutation).toBeCalledWith()
    expect(mockCreateLiveCommand).toBeCalledTimes(2)
    expect(mockCreateLiveCommand).toBeCalledWith({
      command: idleCommand,
      waitUntilComplete: false,
    })
  })

  it('renders alternative text if update takes too long', () => {
    jest.useFakeTimers()
    render(props)

    act(() => {
      jest.advanceTimersByTime(TIME_BEFORE_ALLOWING_EXIT)
    })

    screen.getByText(/Try restarting the update./i)
    screen.getByText(/This update is taking longer than usual/i)
  })

  it('renders alternative text if the robot is initializing', () => {
    mockUseRobotInitializationStatus.mockReturnValue(INIT_STATUS.INITIALIZING)
    mockUseRobotUpdateInfo.mockReturnValue({
      updateStep: 'restart',
      progressPercent: 100,
    })
    render(props)

    screen.getByText(/Initializing robot.../i)
    screen.getByText(
      "This could take up to 40 minutes. Don't turn off the robot."
    )
  })

  it('renders alternative text if update takes too long while robot is initializing', () => {
    jest.useFakeTimers()
    mockUseRobotInitializationStatus.mockReturnValue(INIT_STATUS.INITIALIZING)
    mockUseRobotUpdateInfo.mockReturnValue({
      updateStep: 'restart',
      progressPercent: 100,
    })
    render(props)

    act(() => {
      jest.advanceTimersByTime(TIME_BEFORE_ALLOWING_EXIT_INIT)
    })

    screen.getByText(
      /Check the Advanced tab of its settings page to see whether it updated successfully./i
    )
  })
})
