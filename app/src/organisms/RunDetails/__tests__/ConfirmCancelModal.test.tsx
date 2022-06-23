import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'

import { i18n } from '../../../i18n'
import { useProtocolRunAnalyticsData } from '../../../organisms/Devices/hooks'
import { useTrackEvent } from '../../../redux/analytics'
import { ConfirmCancelModal } from '../../../organisms/RunDetails/ConfirmCancelModal'

jest.mock('../../../redux/analytics')
jest.mock('../../../redux/config')

const mockUseProtocolRunAnalyticsData = useProtocolRunAnalyticsData as jest.MockedFunction<
  typeof useProtocolRunAnalyticsData
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

const render = (props: React.ComponentProps<typeof ConfirmCancelModal>) => {
  return renderWithProviders(<ConfirmCancelModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const RUN_ID = 'mockRunId'
let mockGetProtocolRunAnalyticsData: jest.Mock
let mockTrackEvent: jest.Mock

describe.skip('ConfirmCancelModal', () => {
  let props: React.ComponentProps<typeof ConfirmCancelModal>
  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockGetProtocolRunAnalyticsData = jest.fn()

    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    when(mockUseProtocolRunAnalyticsData).calledWith(RUN_ID).mockReturnValue({
      getProtocolRunAnalyticsData: mockGetProtocolRunAnalyticsData,
    })
    props = { onClose: jest.fn(), runId: RUN_ID }
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should render the correct title', () => {
    const { getByText } = render(props)
    getByText('Are you sure you want to cancel this run?')
  })
  it('should render the correct body', () => {
    const { getByText } = render(props)
    getByText(
      'Doing so will terminate this run, drop any attached tips in the trash container and home your robot.'
    )
    getByText(
      'Additionally, any hardware modules used within the protocol will remain active and maintain their current states until deactivated.'
    )
  })
  it('should render both buttons', () => {
    const { getByRole } = render(props)
    expect(props.onClose).not.toHaveBeenCalled()
    getByRole('button', { name: 'yes, cancel run' })
    getByRole('button', { name: 'no, go back' })
  })
  it('should call yes cancel run button', () => {
    const { getByRole } = render(props)
    expect(props.onClose).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'yes, cancel run' })
    fireEvent.click(closeButton)
    expect(props.onClose).toHaveBeenCalled()
  })
  it('should call No go back button', () => {
    const { getByRole } = render(props)
    const closeButton = getByRole('button', { name: 'no, go back' })
    fireEvent.click(closeButton)
    expect(props.onClose).toHaveBeenCalled()
  })
})
