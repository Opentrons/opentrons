import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { EnhancedMarkdown } from '../index'

const render = (props = {}) => {
  return renderWithProviders(<EnhancedMarkdown content="" {...props} />, {
    i18nInstance: i18n,
  })
}

describe('EnhancedMarkdown', () => {
  it('should render plain text', () => {
    render({ content: 'This is plain text' })
    screen.getByText('This is plain text')
  })

  it('should render headings', () => {
    render({ content: '# Heading 1\n## Heading 2\n### Heading 3' })
    screen.getByRole('heading', { level: 1, name: 'Heading 1' })
    screen.getByRole('heading', { level: 2, name: 'Heading 2' })
    screen.getByRole('heading', { level: 3, name: 'Heading 3' })
  })

  it('should render paragraphs', () => {
    render({ content: 'First paragraph\n\nSecond paragraph' })
    screen.getByText('First paragraph')
    screen.getByText('Second paragraph')
  })

  it('should render links with proper attributes', () => {
    render({ content: '[OpenAI](https://openai.com)' })
    const link = screen.getByRole('link', { name: 'OpenAI' })
    expect(link).toHaveAttribute('href', 'https://openai.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should render unordered lists', () => {
    render({ content: '- Item 1\n- Item 2\n- Item 3' })
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    screen.getByText('Item 1')
    screen.getByText('Item 2')
    screen.getByText('Item 3')
  })

  it('should render ordered lists', () => {
    render({ content: '1. First\n2. Second\n3. Third' })
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    screen.getByText('First')
    screen.getByText('Second')
    screen.getByText('Third')
  })

  it('should render inline code', () => {
    render({ content: 'Use `print()` function' })
    // The text is split into parts with inline code
    screen.getByText(/Use.*function/i)
    // The inline code should be rendered
    screen.getByText('print()')
  })

  it('should render code blocks with Python syntax', () => {
    const codeBlock = '```python\ndef hello():\n    print("Hello")\n```'
    render({ content: codeBlock })

    // Check for essential UI elements from CodeBlock component
    screen.getByText('Python') // Language badge
    screen.getByTitle('Copy code') // Copy button
    screen.getByTitle('Download as .py file') // Download button
  })

  it('should render mixed markdown content', () => {
    const mixedContent = `# Protocol Steps
This is a **bold** text with *italic* parts.

\`\`\`python
def transfer_protocol():
    pipette.transfer(100, source, dest)
    return True
\`\`\`

- Step 1
- Step 2`

    render({ content: mixedContent })
    screen.getByRole('heading', { level: 1, name: 'Protocol Steps' })
    screen.getByText(/This is a/)
    screen.getByText(/bold/)
    screen.getByText(/italic/)

    // Check that Python code appears in the content
    screen.getByText('Python') // Language badge from CodeBlock
    screen.getByTitle('Copy code') // Copy button from CodeBlock

    screen.getByText('Step 1')
    screen.getByText('Step 2')
  })

  it('should handle empty content', () => {
    render({ content: '' })
    // Component should render without errors even with empty content
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
