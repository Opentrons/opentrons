import { initReactI18next } from 'react-i18next'
import { fireEvent, screen } from '@testing-library/react'
import i18n from 'i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'

import { SendButton } from '../index'

import type { ComponentProps } from 'react'

// Create a mock i18n instance for testing
const testI18n = i18n.createInstance()
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      protocol_generator: {
        send: 'Send',
        progressInitializing: 'Initializing...',
        progressProcessing: 'Processing...',
        progressGenerating: 'Generating...',
        progressFinalizing: 'Finalizing...',
      },
    },
  },
})

const mockHandleClick = vi.fn()
const render = (props: ComponentProps<typeof SendButton>) => {
  return renderWithProviders(<SendButton {...props} />, {
    i18nInstance: testI18n,
  })
}

describe('SendButton', () => {
  let props: ComponentProps<typeof SendButton>

  beforeEach(() => {
    props = {
      handleClick: mockHandleClick,
      disabled: true,
      isLoading: false,
    }
  })
  it('should render button with send icon and its initially disabled', () => {
    render(props)
    const button = screen.getByRole('button', { name: 'Send' })
    expect(button).toBeDisabled()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('should render button and its not disabled when disabled false', () => {
    props = { ...props, disabled: false }
    render(props)
    const button = screen.getByRole('button', { name: 'Send' })
    expect(button).not.toBeDisabled()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('should render button with spinner icon when isLoading', () => {
    props = { ...props, isLoading: true }
    render(props)
    const button = screen.getByRole('button', { name: 'Send' })
    expect(button).toBeDisabled()
    // When loading, it shows progress text instead of 'Send'
    expect(screen.queryByText('Send')).not.toBeInTheDocument()
  })

  it('should call a mock function when clicking the button', () => {
    props = { ...props, disabled: false }
    render(props)
    const button = screen.getByRole('button', { name: 'Send' })
    fireEvent.click(button)
    expect(mockHandleClick).toHaveBeenCalled()
  })
})
