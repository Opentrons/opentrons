import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { InputSetting } from '../InputSetting'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof InputSetting>) => {
  return renderWithProviders(<InputSetting {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InputSetting', () => {
  let props: ComponentProps<typeof InputSetting>

  beforeEach(() => {
    props = {
      label: 'Maximum login attempts',
      value: '5',
      units: 'logins',
      min: 1,
      max: 5,
      onBlur: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls onBlur with the parsed number', () => {
    render(props)

    const input = screen.getByLabelText('Maximum login attempts')
    fireEvent.change(input, { target: { value: '3' } })
    fireEvent.blur(input)

    expect(props.onBlur).toHaveBeenCalledWith(3)
    expect(input).toHaveValue(3)
  })

  it('normalizes the displayed value on blur', () => {
    render(props)

    const input = screen.getByLabelText('Maximum login attempts')
    fireEvent.change(input, { target: { value: '03' } })
    fireEvent.blur(input)

    expect(props.onBlur).toHaveBeenCalledWith(3)
    expect(input).toHaveValue(3)
  })

  it('shows a minimum error and does not call onBlur', () => {
    render(props)

    const input = screen.getByLabelText('Maximum login attempts')
    fireEvent.change(input, { target: { value: '0' } })
    fireEvent.blur(input)

    screen.getByText('Minimum of 1 logins')
    expect(props.onBlur).not.toHaveBeenCalled()
    expect(input).toHaveValue(0)
  })

  it('shows a maximum error and does not call onBlur', () => {
    render(props)

    const input = screen.getByLabelText('Maximum login attempts')
    fireEvent.change(input, { target: { value: '6' } })
    fireEvent.blur(input)

    screen.getByText('Maximum of 5 logins')
    expect(props.onBlur).not.toHaveBeenCalled()
    expect(input).toHaveValue(6)
  })

  it('shows a syntax error and does not call onBlur', () => {
    render(props)

    const input = screen.getByLabelText('Maximum login attempts')
    fireEvent.change(input, { target: { value: '1.5' } })
    fireEvent.blur(input)

    screen.getByText('Please enter a valid number')
    expect(props.onBlur).not.toHaveBeenCalled()
  })

  it('reverts to the saved value when onBlur fails', async () => {
    props.onBlur = vi.fn().mockRejectedValue(new Error('patch failed'))
    render(props)

    const input = screen.getByLabelText('Maximum login attempts')
    fireEvent.change(input, { target: { value: '1' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(input).toHaveValue(5)
    })
  })

  it('updates the displayed value when the saved value changes', () => {
    const { rerender } = render(props)

    const input = screen.getByLabelText('Maximum login attempts')
    expect(input).toHaveValue(5)

    rerender(<InputSetting {...props} value="3" />)
    expect(input).toHaveValue(3)
  })
})
