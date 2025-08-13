import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { CodeBlockToolbar } from '../index'

const mockCode = 'def hello_world():\n    print("Hello, World!")'

const render = (props = {}) => {
  return renderWithProviders(<CodeBlockToolbar code={mockCode} {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CodeBlockToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    })
  })

  it('should display Python language badge', () => {
    render()
    screen.getByText('Python')
  })

  it('should display copy button', () => {
    render()
    expect(
      screen.getByRole('button', { name: 'Copy code' })
    ).toBeInTheDocument()
  })

  it('should display download button', () => {
    render()
    expect(
      screen.getByRole('button', { name: 'Download as .py file' })
    ).toBeInTheDocument()
  })

  it('should show copied confirmation when copy button is clicked', async () => {
    render()
    const copyButton = screen.getByRole('button', { name: 'Copy code' })

    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Copied!' })
      ).toBeInTheDocument()
    })
  })

  it('should change button state when clicked', async () => {
    render()
    const copyButton = screen.getByRole('button', { name: 'Copy code' })

    fireEvent.click(copyButton)

    // Should show copied state
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Copied!' })
      ).toBeInTheDocument()
    })
  })
})
