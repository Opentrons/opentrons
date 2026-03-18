import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InputField } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof InputField>) => {
  return renderWithProviders(<InputField {...props} />)[0]
}

describe('InputField', () => {
  let props: ComponentProps<typeof InputField>

  beforeEach(() => {
    props = {
      id: 'input-id',
      title: 'Speed',
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

  it('renders title, caption, units, and input attributes', () => {
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
    const input = screen.getByRole('spinbutton', {
      name: 'Speed',
    })

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

  it('does not bubble rightElement click to onClick handler', () => {
    const onClick = vi.fn()
    props.onClick = onClick
    props.rightElement = <button type="button">right action</button>

    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'right action' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders leftElement and bubbles click to onClick handler', () => {
    const onClick = vi.fn()
    props.onClick = onClick
    props.leftElement = <button type="button">left action</button>

    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'left action' }))

    expect(screen.getByRole('button', { name: 'left action' })).toBeVisible()
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
