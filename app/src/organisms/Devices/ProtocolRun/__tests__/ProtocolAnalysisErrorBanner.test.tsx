import { i18n } from '../../../../i18n'
import { ProtocolAnalysisErrorBanner } from '../ProtocolAnalysisErrorBanner'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import * as React from 'react'

const render = (
  props: React.ComponentProps<typeof ProtocolAnalysisErrorBanner>
) => {
  return renderWithProviders(<ProtocolAnalysisErrorBanner {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolAnalysisErrorBanner', () => {
  let props: React.ComponentProps<typeof ProtocolAnalysisErrorBanner>

  beforeEach(() => {
    props = {
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
  it('renders error banner and show error link', () => {
    const { getByText, getByLabelText } = render(props)
    getByText('Protocol analysis failed.')
    getByLabelText('error_link')
  })
  it('renders error details modal when error link clicked', () => {
    const { getByText, getByLabelText } = render(props)
    const btn = getByLabelText('error_link')
    fireEvent.click(btn)
    getByText('protocol analysis error')
  })
})
