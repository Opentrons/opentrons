import * as React from 'react'
import { i18n } from '../../../../../i18n'
import { act, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  RobotUpdateProgressModal,
  TIME_BEFORE_ALLOWING_EXIT_MS,
} from '../RobotUpdateProgressModal'
import { useRobotUpdateInfo } from '../useRobotUpdateInfo'
import {
  getRobotSessionIsManualFile,
  getRobotUpdateDownloadError,
} from '../../../../../redux/robot-update'
import { useDispatchStartRobotUpdate } from '../../../../../redux/robot-update/hooks'

import type { SetStatusBarCreateCommand } from '@opentrons/shared-data'
import type { RobotUpdateSession } from '../../../../../redux/robot-update/types'

jest.mock('@opentrons/react-api-client')
jest.mock('../useRobotUpdateInfo')
jest.mock('../../../../../redux/robot-update')
jest.mock('../../../../../redux/robot-update/hooks')

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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders robot update download errors', () => {
    mockGetRobotUpdateDownloadError.mockReturnValue('test download error')

    const [{ getByText }] = render(props)
    getByText('test download error')
  })

  it('renders the robot name as a part of the header', () => {
    const [{ getByText }] = render(props)

    expect(getByText('Updating testRobot')).toBeInTheDocument()
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
    const [{ queryByRole, getByText }] = render(props)

    expect(getByText('Installing update...')).toBeInTheDocument()
    expect(
      getByText("This could take up to 15 minutes. Don't turn off the robot.")
    ).toBeInTheDocument()
    expect(queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the correct text when finalizing the robot update with no close button', () => {
    mockUseRobotUpdateInfo.mockReturnValue({
      updateStep: 'restart',
      progressPercent: 100,
    })
    const [{ queryByRole, getByText }] = render(props)

    expect(
      getByText('Install complete, robot restarting...')
    ).toBeInTheDocument()
    expect(
      getByText("This could take up to 15 minutes. Don't turn off the robot.")
    ).toBeInTheDocument()
    expect(queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a success modal and exit button upon finishing the update process', () => {
    mockUseRobotUpdateInfo.mockReturnValue({
      updateStep: 'finished',
      progressPercent: 100,
    })
    const [{ getByText }] = render(props)

    const exitButton = getByText('exit')

    expect(getByText('Robot software successfully updated')).toBeInTheDocument()
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

    const [{ getByText }] = render(props)
    const exitButton = getByText('exit')

    expect(getByText('test error')).toBeInTheDocument()
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
    const [{ findByText }] = render(props)

    act(() => {
      jest.advanceTimersByTime(TIME_BEFORE_ALLOWING_EXIT_MS)
    })

    findByText('Try restarting the update.')
    findByText('testRobot restart is taking longer than expected to restart.')
  })
})
