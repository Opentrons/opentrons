import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { useDownloadRunLog } from '../../hooks'
import { RunFailedModal } from '../RunFailedModal'

import type { RunError } from '@opentrons/api-client'
import { fireEvent, screen } from '@testing-library/react'

jest.mock('../../hooks')

const mockUseDownloadRunLog = useDownloadRunLog as jest.MockedFunction<
  typeof useDownloadRunLog
>

const RUN_ID = '1'
const ROBOT_NAME = 'mockRobotName'
const mockError: RunError = {
  id: '5097b3e6-3900-482d-abb1-0a8d8a0e515d',
  errorType: 'ModuleNotAttachedError',
  createdAt: '2023-08-07T20:16:57.720783+00:00',
  detail: 'No available thermocyclerModuleV2 found.',
  errorCode: '4000',
  errorInfo: {},
  wrappedErrors: [],
}

const render = (props: React.ComponentProps<typeof RunFailedModal>) => {
  return renderWithProviders(<RunFailedModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RunFailedModal - DesktopApp', () => {
  let props: React.ComponentProps<typeof RunFailedModal>

  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      setShowRunFailedModal: jest.fn(),
      highestPriorityError: mockError,
    }
    mockUseDownloadRunLog.mockReturnValue({
      downloadRunLog: jest.fn(),
      isRunLogLoading: false,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text, link and button', () => {
    render(props)
    screen.getByText('Run failed')
    screen.getByText('Error 4000: ModuleNotAttachedError')
    screen.getByText('No available thermocyclerModuleV2 found.')
    screen.getByText(
      'Download the run log and send it to support@opentrons.com for assistance.'
    )
    screen.getByText('Download Run Log')
    screen.getByRole('button', { name: 'Close' })
  })

  it('should call a mock function when clicking close button', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(props.setShowRunFailedModal).toHaveBeenCalled()
  })

  it('should close the modal when clicking close icon', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: '' }))
    expect(props.setShowRunFailedModal).toHaveBeenCalled()
  })

  it('should call a mock function when clicking download run log button', () => {
    render(props)
    fireEvent.click(screen.getByText('Download Run Log'))
    expect(mockUseDownloadRunLog).toHaveBeenCalled()
  })
})
