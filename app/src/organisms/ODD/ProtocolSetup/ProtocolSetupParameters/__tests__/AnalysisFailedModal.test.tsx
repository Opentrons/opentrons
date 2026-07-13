import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useDismissCurrentRunMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'

import { AnalysisFailedModal } from '../AnalysisFailedModal'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'

const PROTOCOL_ID = 'mockProtocolId'
const RUN_ID = 'mockRunId'
const mockSetShowAnalysisFailedModal = vi.fn()
const mockNavigate = vi.fn()
const mockDismissCurrentRunAsync = vi.fn(
  () => new Promise(resolve => resolve({}))
)

vi.mock('@opentrons/react-api-client')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))
vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<NavigateFunction>()
  return {
    ...reactRouterDom,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: ComponentProps<typeof AnalysisFailedModal>) => {
  return renderWithProviders(<AnalysisFailedModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('AnalysisFailedModal', () => {
  let props: ComponentProps<typeof AnalysisFailedModal>

  beforeEach(() => {
    mockDismissCurrentRunAsync.mockClear()
    when(vi.mocked(useDismissCurrentRunMutation))
      .calledWith(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE)
      .thenReturn({
        mutateAsync: mockDismissCurrentRunAsync,
      } as any)
    props = {
      errors: [
        'analysis failed reason message 1',
        'analysis failed reason message 2',
      ],
      protocolId: PROTOCOL_ID,
      runId: RUN_ID,
      setShowAnalysisFailedModal: mockSetShowAnalysisFailedModal,
    }
  })

  it('should render text and button', () => {
    render(props)
    screen.getByText('Protocol analysis failed')
    screen.getByText('With the chosen values, the following error occurred:')
    screen.getByText('analysis failed reason message 1')
    screen.getByText('analysis failed reason message 2')
    screen.getByText('Restart setup and try using different parameter values.')
    screen.getByText('Restart setup')
  })

  it('should call a mock function when tapping close button', () => {
    render(props)
    fireEvent.click(screen.getByLabelText('closeIcon'))
    expect(mockSetShowAnalysisFailedModal).toHaveBeenCalled()
  })

  it('should call mock dismiss current run function when tapping restart setup button', () => {
    render(props)
    fireEvent.click(screen.getByText('Restart setup'))
    expect(mockDismissCurrentRunAsync).toHaveBeenCalledWith(RUN_ID)
  })
})
