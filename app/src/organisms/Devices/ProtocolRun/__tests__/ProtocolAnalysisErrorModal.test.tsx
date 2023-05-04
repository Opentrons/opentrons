import { i18n } from '../../../../i18n'
import { ProtocolAnalysisErrorModal } from '../ProtocolAnalysisErrorModal'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import * as React from 'react'

const render = (
  props: React.ComponentProps<typeof ProtocolAnalysisErrorModal>
) => {
  return renderWithProviders(<ProtocolAnalysisErrorModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolAnalysisErrorModal', () => {
  let props: React.ComponentProps<typeof ProtocolAnalysisErrorModal>

  beforeEach(() => {
    props = {
      displayName: 'test_protocol',
      robotName: 'test_robot',
      onClose: jest.fn(),
      errors: [
        {
          id: 'error_id',
          detail: 'protocol analysis error',
          errorType: 'analysis',
          createdAt: '100000',
        },
      ],
    }
  })
  it('renders error modal', () => {
    const { getByText, getByLabelText } = render(props)
    getByText('protocol analysis error')
    getByLabelText('close_analysis_error_modal')
  })
  it('calls onClose when close button clicked', () => {
    const { getByLabelText } = render(props)
    const btn = getByLabelText('close_analysis_error_modal')
    fireEvent.click(btn)
    expect(props.onClose).toHaveBeenCalled()
  })
})
