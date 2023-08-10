import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import { RunFailedModal } from '../RunFailedModal'

jest.mock('@opentrons/react-api-client')

const RUN_ID = 'mock_runID'
const mockFn = jest.fn()
const mockPush = jest.fn()
const mockErrors = [
  {
    id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
    errorType: 'generalError',
    createdAt: '2023-04-09T21:41:51.333171+00:00',
    detail: 'Error with code 4000 (lowest priority)',
    errorInfo: {},
    errorCode: '4000',
    wrappedErrors: [
      {
        id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
        errorType: 'roboticsInteractionError',
        createdAt: '2023-04-09T21:41:51.333171+00:00',
        detail: 'Error with code 3000 (second lowest priortiy)',
        errorInfo: {},
        errorCode: '3000',
        wrappedErrors: [],
      },
      {
        id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
        errorType: 'roboticsControlError',
        createdAt: '2023-04-09T21:41:51.333171+00:00',
        detail: 'Error with code 2000 (second highest priority)',
        errorInfo: {},
        errorCode: '2000',
        wrappedErrors: [
          {
            id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
            errorType: 'hardwareCommunicationError',
            createdAt: '2023-04-09T21:41:51.333171+00:00',
            detail: 'Error with code 1000 (highest priority)',
            errorInfo: {},
            errorCode: '1000',
            wrappedErrors: [],
          },
        ],
      },
    ],
  },
  {
    id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
    errorType: 'roboticsInteractionError',
    createdAt: '2023-04-09T21:41:51.333171+00:00',
    detail: 'Error with code 2001 (second highest priortiy)',
    errorInfo: {},
    errorCode: '2001',
    wrappedErrors: [],
  },
]

let mockStopRun: jest.Mock

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockUseStopRunMutation = useStopRunMutation as jest.MockedFunction<
  typeof useStopRunMutation
>

const render = (props: React.ComponentProps<typeof RunFailedModal>) => {
  return renderWithProviders(
    <MemoryRouter>
      <RunFailedModal {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RunFailedModal', () => {
  let props: React.ComponentProps<typeof RunFailedModal>

  beforeEach(() => {
    props = {
      runId: RUN_ID,
      setShowRunFailedModal: mockFn,
      errors: mockErrors,
    }
    mockStopRun = jest.fn((_runId, opts) => opts.onSuccess())
    mockUseStopRunMutation.mockReturnValue({ stopRun: mockStopRun } as any)
  })

  it('should render the highest priority error', () => {
    const [{ getByText }] = render(props)
    getByText('Run failed')
    getByText('Error 1000: hardwareCommunicationError')
    getByText('Error with code 1000 (highest priority)')
    getByText(
      'Download the run logs from the Opentrons App and send it to support@opentrons.com for assistance.'
    )
    getByText('Close')
  })

  it('when tapping close, call mock functions', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Close')
    fireEvent.click(button)
    expect(mockStopRun).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})
