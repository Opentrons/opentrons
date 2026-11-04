import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { ProtocolAnalysisErrorModal } from '../ProtocolAnalysisErrorModal'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ProtocolAnalysisErrorModal>) => {
  return renderWithProviders(<ProtocolAnalysisErrorModal {...props} />)
}

describe('ProtocolAnalysisErrorModal', () => {
  let props: ComponentProps<typeof ProtocolAnalysisErrorModal>

  beforeEach(() => {
    props = {
      errors: [
        {
          id: 'error-id',
          detail: 'protocol analysis error',
          errorType: 'analysis',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      onClose: vi.fn(),
    }
  })

  it('renders error.detail for each error in errors array', () => {
    render(props)
    screen.getByText('protocol analysis error')
    screen.getByLabelText('close_analysis_error_modal')
  })

  it('calls onClose when close button is clicked', () => {
    render(props)
    const btn = screen.getByLabelText('close_analysis_error_modal')
    fireEvent.click(btn)
    expect(props.onClose).toHaveBeenCalled()
  })
})
