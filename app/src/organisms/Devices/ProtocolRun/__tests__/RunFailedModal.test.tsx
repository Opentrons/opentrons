import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { useDownloadRunLog } from '../../hooks'
import { RunFailedModal } from '../RunFailedModal'

import type { RunError } from '@opentrons/api-client'

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
    const [{ getByText, getByRole }] = render(props)
    getByText('Run failed')
    getByText('Error 4000: ModuleNotAttachedError')
    getByText('No available thermocyclerModuleV2 found.')
    getByText(
      'Download the run log and send it to support@opentrons.com for assistance.'
    )
    getByText('Download Run Log')
    getByRole('button', { name: 'Close' })
  })

  it('should call a mock function when clicking close button', () => {
    const [{ getByRole }] = render(props)
    getByRole('button', { name: 'Close' }).click()
    expect(props.setShowRunFailedModal).toHaveBeenCalled()
  })

  it('should close the modal when clicking close icon', () => {
    const [{ getByRole }] = render(props)
    getByRole('button', { name: '' }).click()
    expect(props.setShowRunFailedModal).toHaveBeenCalled()
  })

  it('should call a mock function when clicking download run log button', () => {
    const [{ getByText }] = render(props)
    getByText('Download Run Log').click()
    expect(mockUseDownloadRunLog).toHaveBeenCalled()
  })
})
