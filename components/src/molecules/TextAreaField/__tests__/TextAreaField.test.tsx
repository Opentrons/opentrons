import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TextAreaField } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TextAreaField>) => {
  return renderWithProviders(<TextAreaField {...props} />)
}

describe('TextAreaField', () => {
  let props: ComponentProps<typeof TextAreaField>

  beforeEach(() => {
    props = {
      label: 'textAreaField',
      placeholder: 'Enter text...',
      value: '',
      onChange: vi.fn(),
      id: 'textAreaField',
    }
  })

  it('renders the TextAreaField component', () => {
    render(props)
    screen.getByText('textAreaField')
    const textarea = screen.getByRole('textbox', { name: 'textAreaField' })
    expect(textarea).toBeInTheDocument()
  })

  it('displays the correct placeholder text', () => {
    render(props)
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
  })

  it('updates value when user types', () => {
    render(props)
    const textarea = screen.getByRole('textbox', { name: 'textAreaField' })

    fireEvent.change(textarea, { target: { value: 'Hello, world!' } })

    expect(props.onChange).toHaveBeenCalledTimes(1)
  })

  it('disables the textarea when disabled prop is true', () => {
    props.disabled = true
    render(props)
    const textarea = screen.getByRole('textbox', { name: 'textAreaField' })
    expect(textarea).toBeDisabled()
  })

  it('displays an error message when error prop is provided', () => {
    props.error = 'Error: Invalid input'
    render(props)

    expect(screen.getByText('Error: Invalid input')).toBeInTheDocument()
  })

  it('display an icon when tooltip prop is provided', () => {
    props.tooltipText = 'ot-icon-check'
    render(props)
    screen.getByTestId('tooltip-icon')
  })

  it('display left icon when leftIcon prop is provided', () => {
    props.leftElement = 'information'
    render(props)
    screen.getByText('information')
  })

  it('applies multiline layout classes when multiline prop is true', () => {
    props.multiline = true
    render(props)
    const textarea = screen.getByRole('textbox', { name: 'textAreaField' })
    expect(textarea.className).toMatch(/textarea_multiline/)
  })
})
