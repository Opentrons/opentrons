import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useStopRunMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { RunFailedModal } from '../RunFailedModal'

import type { useHistory } from 'react-router-dom'

vi.mock('@opentrons/react-api-client')

const RUN_ID = 'mock_runID'
const mockFn = vi.fn()
const mockPush = vi.fn()
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

const mockStopRun = vi.fn((_runId, opts) => opts.onSuccess())

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof useHistory>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})

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

    vi.mocked(useStopRunMutation).mockReturnValue({
      stopRun: mockStopRun,
    } as any)
  })

  it('should render the highest priority error', () => {
    render(props)
    screen.getByText('Run failed')
    screen.getByText('Error 1000: hardwareCommunicationError')
    screen.getByText('Error with code 1000 (highest priority)')
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
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})
