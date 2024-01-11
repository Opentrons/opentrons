import 'jest-styled-components'
import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders, COLORS, SIZE_2 } from '@opentrons/components'

import { ToggleButton } from '..'

const mockOnClick = jest.fn()

const render = (props: React.ComponentProps<typeof ToggleButton>) => {
  return renderWithProviders(<ToggleButton {...props} />)[0]
}

describe('ToggleButton', () => {
  let props: React.ComponentProps<typeof ToggleButton>

  beforeEach(() => {
    props = {
      label: 'toggle button',
      id: 'mock-toggle-button',
      toggledOn: true,
      disabled: false,
      onClick: mockOnClick,
    }
  })

  it('renders toggle button - on', () => {
    const { getByLabelText } = render(props)
    const button = getByLabelText('toggle button')
    expect(button).toHaveStyle(`color: ${String(COLORS.blueEnabled)}`)
    expect(button).toHaveStyle(`height: ${String(SIZE_2)}`)
    expect(button).toHaveStyle(`width: ${String(SIZE_2)}`)
    expect(button).toHaveAttribute('aria-checked', 'true')
  })

  it('applies the correct states to the toggle on- hover', () => {
    const { getByLabelText } = render(props)
    const button = getByLabelText('toggle button')
    expect(button).toHaveStyleRule('color', `${String(COLORS.blueHover)}`, {
      modifier: ':hover',
    })
  })

  it('applies the correct states to the toggle on- focus-visible', () => {
    const { getByLabelText } = render(props)
    const button = getByLabelText('toggle button')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.warningEnabled)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it('applies the correct states to the toggle on- disabled', () => {
    props.disabled = true
    const { getByLabelText } = render(props)
    const button = getByLabelText('toggle button')
    expect(button).toHaveStyleRule(
      'color',
      `${String(COLORS.grey50Disabled)}`,
      {
        modifier: ':disabled',
      }
    )
  })

  it('calls mock function when clicking the toggle button - on', () => {
    const { getByLabelText } = render(props)
    const button = getByLabelText('toggle button')
    fireEvent.click(button)
    expect(props.onClick).toHaveBeenCalled()
  })

  it('renders toggle button - off', () => {
    props.toggledOn = false
    const { getByLabelText } = render(props)
    const button = getByLabelText('toggle button')
    expect(button).toHaveStyle(`color: ${String(COLORS.grey50Enabled)}`)
    expect(button).toHaveStyle(`height: ${String(SIZE_2)}`)
    expect(button).toHaveStyle(`width: ${String(SIZE_2)}`)
    expect(button).toHaveAttribute('aria-checked', 'false')
  })

  it('applies the correct states to the toggle off- hover', () => {
    props.toggledOn = false
    const { getByLabelText } = render(props)
    const button = getByLabelText('toggle button')
    expect(button).toHaveStyleRule('color', `${String(COLORS.grey55)}`, {
      modifier: ':hover',
    })
  })

  it('applies the correct states to the toggle off- focus-visible', () => {
    props.toggledOn = false
    const { getByLabelText } = render(props)
    const button = getByLabelText('toggle button')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.warningEnabled)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it('applies the correct states to the toggle off- disabled', () => {
    props.toggledOn = false
    props.disabled = true
    const { getByLabelText } = render(props)
    const button = getByLabelText('toggle button')
    expect(button).toHaveStyleRule(
      'color',
      `${String(COLORS.grey50Disabled)}`,
      {
        modifier: ':disabled',
      }
    )
  })

  it('calls mock function when clicking the toggle button - off', () => {
    props.toggledOn = false
    const { getByLabelText } = render(props)
    const button = getByLabelText('toggle button')
    fireEvent.click(button)
    expect(props.onClick).toHaveBeenCalled()
  })
})
