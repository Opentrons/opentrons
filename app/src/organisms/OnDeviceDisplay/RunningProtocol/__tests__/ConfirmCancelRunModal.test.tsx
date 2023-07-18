import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import {
  useStopRunMutation,
  useDismissCurrentRunMutation,
} from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import { useTrackProtocolRunEvent } from '../../../../organisms/Devices/hooks'
import { useTrackEvent } from '../../../../redux/analytics'
import { ConfirmCancelRunModal } from '../ConfirmCancelRunModal'
import { CancelingRunModal } from '../CancelingRunModal'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../redux/analytics')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../CancelingRunModal')

const mockPush = jest.fn()
let mockStopRun: jest.Mock
let mockDismissCurrentRun: jest.Mock
let mockTrackEvent: jest.Mock
let mockTrackProtocolRunEvent: jest.Mock

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockUseTrackProtocolRunEvent = useTrackProtocolRunEvent as jest.MockedFunction<
  typeof useTrackProtocolRunEvent
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockUseStopRunMutation = useStopRunMutation as jest.MockedFunction<
  typeof useStopRunMutation
>
const mockUseDismissCurrentRunMutation = useDismissCurrentRunMutation as jest.MockedFunction<
  typeof useDismissCurrentRunMutation
>
const mockCancelingRunModal = CancelingRunModal as jest.MockedFunction<
  typeof CancelingRunModal
>
const render = (props: React.ComponentProps<typeof ConfirmCancelRunModal>) => {
  return renderWithProviders(
    <MemoryRouter>
      <ConfirmCancelRunModal {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const RUN_ID = 'mock_runID'
const mockFn = jest.fn()

describe('ConfirmCancelRunModal', () => {
  let props: React.ComponentProps<typeof ConfirmCancelRunModal>

  beforeEach(() => {
    props = {
      isActiveRun: true,
      runId: RUN_ID,
      setShowConfirmCancelRunModal: mockFn,
    }
    mockTrackEvent = jest.fn()
    mockStopRun = jest.fn((_runId, opts) => opts.onSuccess())
    mockDismissCurrentRun = jest.fn()
    mockTrackProtocolRunEvent = jest.fn(
      () => new Promise(resolve => resolve({}))
    )
    mockUseStopRunMutation.mockReturnValue({ stopRun: mockStopRun } as any)
    mockUseDismissCurrentRunMutation.mockReturnValue({
      dismissCurrentRun: mockDismissCurrentRun,
      isLoading: false,
    } as any)
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    when(mockUseTrackProtocolRunEvent).calledWith(RUN_ID).mockReturnValue({
      trackProtocolRunEvent: mockTrackProtocolRunEvent,
    })
    mockCancelingRunModal.mockReturnValue(<div>mock CancelingRunModal</div>)
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should render text and buttons', () => {
    const [{ getByText, getAllByRole }] = render(props)
    getByText('Are you sure you want to cancel this run?')
    getByText(
      'Doing so will terminate this run, drop any attached tips in the trash container and home your robot.'
    )
    getByText(
      'Additionally, any hardware modules used within the protocol will remain active and maintain their current states until deactivated.'
    )
    expect(getAllByRole('button').length).toBe(2)
    getByText('Go back')
    getByText('Cancel run')
  })

  it('shoudler render the canceling run modal when run is dismissing', () => {
    mockUseDismissCurrentRunMutation.mockReturnValue({
      dismissCurrentRun: mockDismissCurrentRun,
      isLoading: true,
    } as any)
    const [{ getByText }] = render(props)
    getByText('mock CancelingRunModal')
  })

  it('when tapping go back, the mock function is called', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Go back')
    fireEvent.click(button)
    expect(mockFn).toHaveBeenCalled()
  })

  it('when tapping cancel run, the modal is closed', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Cancel run')
    fireEvent.click(button)
    expect(mockStopRun).toHaveBeenCalled()
    expect(mockDismissCurrentRun).toHaveBeenCalled()
    expect(mockTrackProtocolRunEvent).toHaveBeenCalled()
  })

  it('when tapping cancel run the modal - in prepare to run', () => {
    props = {
      ...props,
      isActiveRun: false,
    }
    const [{ getByText }] = render(props)
    const button = getByText('Cancel run')
    fireEvent.click(button)
    expect(mockStopRun).toHaveBeenCalled()
    expect(mockDismissCurrentRun).toHaveBeenCalled()
    expect(mockTrackProtocolRunEvent).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/protocols')
  })
})
