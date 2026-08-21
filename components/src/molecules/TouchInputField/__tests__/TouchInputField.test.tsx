import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TouchInputField } from '../'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TouchInputField>) => {
  return renderWithProviders(<TouchInputField {...props} />)[0]
}

describe('TouchInputField', () => {
  let props: ComponentProps<typeof TouchInputField>

  beforeEach(() => {
    props = {
      id: 'touch-input-id',
      label: 'Speed',
      type: 'number',
      caption: 'caption',
      max: 10,
      min: 1,
      units: 'rpm',
      value: '5',
      disabled: false,
      onFocus: vi.fn(),
      onBlur: vi.fn(),
      onChange: vi.fn(),
      readOnly: false,
      autoFocus: false,
    }
  })

  it('renders label, caption, units, and input attributes', () => {
    render(props)
    const input = screen.getByRole('spinbutton', {
      name: 'Speed',
    }) as HTMLInputElement

    screen.getByText('Speed')
    screen.getByText('caption')
    screen.getByText('rpm')
    expect(input.type).toBe('number')
    expect(input.value).toBe('5')
    expect(input.min).toBe('1')
    expect(input.max).toBe('10')
  })

  it('renders indeterminate state as empty value with dash placeholder', () => {
    props.isIndeterminate = true
    props.value = '9'
    props.placeholder = 'placeholder'

    render(props)
    const input = screen.getByRole('spinbutton', {
      name: 'Speed',
    }) as HTMLInputElement

    expect(input.value).toBe('')
    expect(input.placeholder).toBe('-')
  })

  it('calls onFocus, onBlur, and onChange handlers', () => {
    render(props)
    const input = screen.getByRole('spinbutton', { name: 'Speed' })

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '7' } })
    fireEvent.blur(input)

    expect(props.onFocus).toHaveBeenCalledTimes(1)
    expect(props.onChange).toHaveBeenCalledTimes(1)
    expect(props.onBlur).toHaveBeenCalledTimes(1)
  })

  it('renders error text when error is provided', () => {
    props.error = 'error'

    render(props)
    screen.getByText('error')
  })

  it('renders an accessory beside the input field', () => {
    props.accessory = <button type="button">Show</button>

    render(props)
    screen.getByRole('button', { name: 'Show' })
  })

  it('bubbles click from units to onClick handler', () => {
    const onClick = vi.fn()
    props.onClick = onClick

    render(props)
    fireEvent.click(screen.getByText('rpm'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    props.onClick = onClick
    props.disabled = true
    props.testId = 'touch-input-id'

    render(props)
    const input = screen.getByRole('spinbutton', { name: 'Speed' })
    fireEvent.click(input)

    expect(onClick).not.toHaveBeenCalled()
  })
})
