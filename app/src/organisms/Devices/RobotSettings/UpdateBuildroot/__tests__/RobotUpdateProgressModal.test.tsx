import * as React from 'react'
import { i18n } from '../../../../../i18n'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { RobotUpdateProgressModal } from '../RobotUpdateProgressModal'

const render = (
  props: React.ComponentProps<typeof RobotUpdateProgressModal>
) => {
  return renderWithProviders(<RobotUpdateProgressModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DownloadUpdateModal', () => {
  let props: React.ComponentProps<typeof RobotUpdateProgressModal>

  beforeEach(() => {
    props = {
      robotName: 'testRobot',
      updateStep: 'download',
      error: null,
      stepProgress: 50,
      closeUpdateBuildroot: jest.fn(),
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the robot name as a part of the header', () => {
    const [{ getByText }] = render(props)

    expect(getByText('Updating testRobot')).toBeInTheDocument()
  })

  it('renders the correct text when downloading the robot update with no close button', () => {
    const [{ queryByRole, getByText }] = render(props)

    expect(getByText('Downloading update...')).toBeInTheDocument()
    expect(
      getByText('Do not turn off the robot while updating')
    ).toBeInTheDocument()
    expect(queryByRole('button')).not.toBeInTheDocument()
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
    fireEvent.click(exitButton)
    expect(props.closeUpdateBuildroot).toHaveBeenCalled()
  })

  it('renders an error modal and exit button if an error occurs', () => {
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
  })
})
