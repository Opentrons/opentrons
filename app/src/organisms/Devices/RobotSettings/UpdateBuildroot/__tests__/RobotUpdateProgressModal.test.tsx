import * as React from 'react'
import { i18n } from '../../../../../i18n'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import type { SetStatusBarCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/incidental'

import { RobotUpdateProgressModal } from '../RobotUpdateProgressModal'

jest.mock('@opentrons/react-api-client')
jest.mock('@opentrons/shared-data/protocol/types/schemaV7/command/incidental')

const mockUseCreateLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const render = (
  props: React.ComponentProps<typeof RobotUpdateProgressModal>
) => {
  return renderWithProviders(<RobotUpdateProgressModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DownloadUpdateModal', () => {
  let props: React.ComponentProps<typeof RobotUpdateProgressModal>
  let mockCreateLiveCommand = jest.fn()

  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    props = {
      robotName: 'testRobot',
      updateStep: 'download',
      error: null,
      stepProgress: 50,
      closeUpdateBuildroot: jest.fn(),
    }
    mockUseCreateLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
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
    props = {
      ...props,
      updateStep: 'install',
    }

    const [{ queryByRole, getByText }] = render(props)

    expect(getByText('Installing update...')).toBeInTheDocument()
    expect(
      getByText('Do not turn off the robot while updating')
    ).toBeInTheDocument()
    expect(queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the correct text when finalizing the robot update with no close button', () => {
    props = {
      ...props,
      updateStep: 'restart',
    }

    const [{ queryByRole, getByText }] = render(props)

    expect(
      getByText('Install complete, robot restarting...')
    ).toBeInTheDocument()
    expect(
      getByText('Do not turn off the robot while updating')
    ).toBeInTheDocument()
    expect(queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a success modal and exit button upon finishing the update process', () => {
    props = {
      ...props,
      updateStep: 'finished',
    }
    const [{ getByText }] = render(props)

    const exitButton = getByText('exit')

    expect(getByText('Robot software successfully updated')).toBeInTheDocument()
    expect(exitButton).toBeInTheDocument()
    expect(mockCreateLiveCommand).toBeCalledTimes(1)
    fireEvent.click(exitButton)
    expect(props.closeUpdateBuildroot).toHaveBeenCalled()
  })

  it('renders an error modal and exit button if an error occurs', () => {
    const idleCommand: SetStatusBarCreateCommand = {
      commandType: 'setStatusBar',
      params: { animation: 'idle' },
    }
    props = {
      ...props,
      error: 'test error',
    }
    const [{ getByText }] = render(props)

    const exitButton = getByText('exit')

    expect(getByText('test error')).toBeInTheDocument()
    fireEvent.click(exitButton)
    expect(getByText('Try again')).toBeInTheDocument()
    expect(props.closeUpdateBuildroot).toHaveBeenCalled()

    expect(mockUseCreateLiveCommandMutation).toBeCalledWith()
    expect(mockCreateLiveCommand).toBeCalledTimes(2)
    expect(mockCreateLiveCommand).toBeCalledWith({
      command: idleCommand,
      waitUntilComplete: false,
    })
  })
})
