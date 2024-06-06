import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { AnalysisFailedModal } from '../AnalysisFailedModal'
import type * as ReactRouterDom from 'react-router-dom'

const mockPush = vi.fn()
const PROTOCOL_ID = 'mockId'
const mockSetShowAnalysisFailedModal = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<typeof ReactRouterDom>()
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof AnalysisFailedModal>) => {
  return renderWithProviders(<AnalysisFailedModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('AnalysisFailedModal', () => {
  let props: React.ComponentProps<typeof AnalysisFailedModal>

  beforeEach(() => {
    props = {
      errors: [
        'analysis failed reason message 1',
        'analysis failed reason message 2',
      ],
      protocolId: PROTOCOL_ID,
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

  it('should call a mock function when tapping restart setup button', () => {
    render(props)
    fireEvent.click(screen.getByText('Restart setup'))
    expect(mockPush).toHaveBeenCalledWith(`/protocols/${PROTOCOL_ID}`)
  })

  it('should push to protocols dashboard when tapping restart setup button and protocol ID is null', () => {
    render({ ...props, protocolId: null })
    fireEvent.click(screen.getByText('Restart setup'))
    expect(mockPush).toHaveBeenCalledWith('/protocols')
  })
})
