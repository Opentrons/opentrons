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
    errorType: 'ExceptionInProtocolError',
    createdAt: '2023-04-09T21:41:51.333171+00:00',
    detail:
      'ProtocolEngineError [line 16]: ModuleNotAttachedError: No available',
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

  it('should render text and button', () => {
    const [{ getByText }] = render(props)
    getByText('Run failed')
    getByText(
      'ProtocolEngineError [line 16]: ModuleNotAttachedError: No available'
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
  // ToDo (kj:04/12/2023) I made this test todo since we need the system update to align with the design.
  // This test will be added when we can get error code and other information
  it.todo('should render error code and message')
})
