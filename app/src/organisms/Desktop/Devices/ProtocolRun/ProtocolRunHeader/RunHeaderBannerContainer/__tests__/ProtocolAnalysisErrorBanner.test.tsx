import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import type { ComponentProps } from 'react'
import { beforeEach, describe, it } from 'vitest'
import { ProtocolAnalysisErrorBanner } from '../ProtocolAnalysisErrorBanner'

const render = (props: ComponentProps<typeof ProtocolAnalysisErrorBanner>) => {
  return renderWithProviders(<ProtocolAnalysisErrorBanner {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolAnalysisErrorBanner', () => {
  let props: ComponentProps<typeof ProtocolAnalysisErrorBanner>

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
    render(props)
    screen.getByText('Protocol analysis failed.')
    screen.getByLabelText('error_link')
  })
  it('renders error details modal when error link clicked', () => {
    render(props)
    const btn = screen.getByLabelText('error_link')
    fireEvent.click(btn)
    screen.getByText('protocol analysis error')
  })
})
