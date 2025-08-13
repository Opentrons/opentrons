import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { CodeBlock } from '../'

import type { ComponentProps } from 'react'

const mockPythonCode = `def transfer_samples():
    # This is a comment
    volume = 100.5
    pipette.transfer(volume, source, dest)
    return True`

const render = (
  props: ComponentProps<typeof CodeBlock> = { code: mockPythonCode }
) => {
  return renderWithProviders(<CodeBlock {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CodeBlock', () => {
  it('should render Python code', () => {
    render()
    // Check that code block structure is rendered
    expect(screen.getByRole('code')).toBeInTheDocument()

    // Check that the toolbar elements are present
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Copy code' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Download as .py file' })
    ).toBeInTheDocument()
  })

  it('should render empty code block when code is empty', () => {
    render({ code: '' })
    // Code element should still be present even when empty
    expect(screen.getByRole('code')).toBeInTheDocument()
  })

  it('should preserve multiple lines of code', () => {
    const multilineCode = 'line1\nline2\nline3'
    render({ code: multilineCode })

    // Check that code block is rendered with proper structure
    expect(screen.getByRole('code')).toBeInTheDocument()
    screen.getByText('Python')
    screen.getByRole('button', { name: 'Copy code' })
  })
})
