import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RUN_STATUS_FAILED } from '@opentrons/api-client'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { RunFailedModal } from '..'
import { ErrorContent } from '../ErrorContent'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'

vi.mock('@opentrons/react-api-client')
vi.mock('../ErrorContent')
vi.mock('/app/local-resources/access-control/useGuardedAction', () => ({
  useGuardedAction: () => ({ reasonForInteractionRequired: false }),
}))

const RUN_ID = 'mock_runID'
const mockFn = vi.fn()
const mockNavigate = vi.fn()
const mockErrors = [
  {
    id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
    errorType: 'generalError',
    isDefined: false as const,
    createdAt: '2023-04-09T21:41:51.333171+00:00',
    detail: 'Error with code 4000 (lowest priority)',
    errorInfo: {},
    errorCode: '4000' as const,
    wrappedErrors: [
      {
        id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
        errorType: 'roboticsInteractionError',
        isDefined: false as const,
        createdAt: '2023-04-09T21:41:51.333171+00:00',
        detail: 'Error with code 3000 (second lowest priortiy)',
        errorInfo: {},
        errorCode: '3000' as const,
        wrappedErrors: [],
      },
      {
        id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
        errorType: 'roboticsControlError',
        isDefined: false as const,
        createdAt: '2023-04-09T21:41:51.333171+00:00',
        detail: 'Error with code 2000 (second highest priority)',
        errorInfo: {},
        errorCode: '2000' as const,
        wrappedErrors: [
          {
            id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
            errorType: 'hardwareCommunicationError',
            isDefined: false as const,
            createdAt: '2023-04-09T21:41:51.333171+00:00',
            detail: 'Error with code 1000 (highest priority)',
            errorInfo: {},
            errorCode: '1000' as const,
            wrappedErrors: [],
          },
        ],
      },
    ],
  },
  {
    id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
    errorType: 'roboticsInteractionError',
    isDefined: false as const,
    createdAt: '2023-04-09T21:41:51.333171+00:00',
    detail: 'Error with code 2001 (second highest priortiy)',
    errorInfo: {},
    errorCode: '2001' as const,
    wrappedErrors: [],
  },
]

const mockStopRun = vi.fn((_runId, opts) => opts.onSuccess())

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: ComponentProps<typeof RunFailedModal>) => {
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
  let props: ComponentProps<typeof RunFailedModal>

  beforeEach(() => {
    props = {
      runId: RUN_ID,
      setShowRunFailedModal: mockFn,
      errors: mockErrors,
      runStatus: RUN_STATUS_FAILED,
    }

    vi.mocked(useStopRunMutation).mockReturnValue({
      stopRun: mockStopRun,
    } as any)
    vi.mocked(ErrorContent).mockReturnValue(<div>mock ErrorContent</div>)
  })

  it('should pass highest priority error to ErrorContent', () => {
    render(props)
    screen.getByText('Run failed')
    screen.getByText('mock ErrorContent')
    screen.getByText(
      'Download the robot logs from the Opentrons App and send it to support@opentrons.com for assistance.'
    )
    screen.getByText('Close')
  })

  it('when tapping close, call mock functions', () => {
    render(props)
    const button = screen.getByText('Close')
    fireEvent.click(button)
    expect(mockStopRun).toHaveBeenCalled()
    expect(props.setShowRunFailedModal).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })
})
