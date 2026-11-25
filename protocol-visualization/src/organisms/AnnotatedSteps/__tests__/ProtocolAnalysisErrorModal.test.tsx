import { initReactI18next } from 'react-i18next'
import { fireEvent, screen } from '@testing-library/react'
import i18n from 'i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import en from '../../../assets/localization/en/protocol_visualization.json'
import { ProtocolAnalysisErrorModal } from '../ProtocolAnalysisErrorModal'

import type { ComponentProps } from 'react'

const i18nInstance = i18n.createInstance()
i18nInstance.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { protocol_visualization: en } },
})

const render = (props: ComponentProps<typeof ProtocolAnalysisErrorModal>) => {
  return renderWithProviders(<ProtocolAnalysisErrorModal {...props} />, {
    i18nInstance,
  })
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
    screen.getByRole('button', { name: 'Close' })
  })

  it('calls onClose when close button is clicked', () => {
    render(props)
    const btn = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(btn)
    expect(props.onClose).toHaveBeenCalled()
  })
})
