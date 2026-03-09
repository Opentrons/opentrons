import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Slider } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof Slider>) => {
  return renderWithProviders(<Slider {...props} />)[0]
}

describe('Slider', () => {
  let props: ComponentProps<typeof Slider>

  beforeEach(() => {
    props = {
      value: 50,
      adjustValue: vi.fn(),
      label: 'Test Label',
    }
  })

  it('renders slider with value percentage', () => {
    render(props)
    screen.getByText('50%')
  })

  it('renders slider with label when provided', () => {
    render(props)
    screen.getByText('Test Label')
    screen.getByText('50%')
  })

  it('renders slider input with correct attributes', () => {
    render(props)
    const slider = screen.getByRole('slider', { name: 'Test Label' })
    expect(slider).toHaveAttribute('type', 'range')
    expect(slider).toHaveAttribute('min', '1')
    expect(slider).toHaveAttribute('max', '100')
    expect(slider).toHaveValue('50')
  })

  it('calls adjustValue when slider value changes', () => {
    render(props)
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '75' } })
    expect(props.adjustValue).toHaveBeenCalledWith(75)
  })

  it('renders without label when label is not provided', () => {
    render(props)
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
    screen.getByText('50%')
  })

  it('updates displayed value when value prop changes', () => {
    const { rerender } = render(props)
    screen.getByText('50%')
    rerender(<Slider {...props} value={25} />)
    screen.getByText('25%')
  })
})
