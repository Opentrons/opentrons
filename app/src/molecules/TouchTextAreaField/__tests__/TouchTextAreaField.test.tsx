import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { TouchTextAreaField } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TouchTextAreaField>) => {
  return renderWithProviders(<TouchTextAreaField {...props} />)
}

describe('TouchTextAreaField', () => {
  let props: ComponentProps<typeof TouchTextAreaField>

  beforeEach(() => {
    props = {
      label: 'TouchTextAreaField',
      placeholder: 'Enter text...',
      value: '',
      onChange: vi.fn(),
      id: 'touchTextArea',
    }
  })

  it('renders the TextAreaField component', () => {
    render(props)
    screen.getByText('TouchTextAreaField')
    const textarea = screen.getByRole('textbox', { name: /touchTextArea/i })
    expect(textarea).toBeInTheDocument()
  })

  it('displays the correct placeholder text', () => {
    render(props)
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
  })

  it('updates value when user types', () => {
    render(props)
    const textarea = screen.getByRole('textbox', { name: /touchTextArea/i })
    fireEvent.change(textarea, { target: { value: 'Hello, world!' } })
    expect(props.onChange).toHaveBeenCalledTimes(1)
  })

  it('disables the textarea when disabled prop is true', () => {
    props.disabled = true
    render(props)
    const textarea = screen.getByRole('textbox', { name: /touchTextArea/i })
    expect(textarea).toBeDisabled()
  })

  it('displays an error message when error prop is provided', () => {
    props.error = 'Error: Invalid input'
    render(props)
    expect(screen.getByText('Error: Invalid input')).toBeInTheDocument()
  })

  it('applies multiline layout classes when multiline prop is true', () => {
    props.multiline = true
    render(props)
    const textarea = screen.getByRole('textbox', { name: /touchTextArea/i })
    expect(textarea.className).toMatch(/textarea_multiline/)
  })
})
