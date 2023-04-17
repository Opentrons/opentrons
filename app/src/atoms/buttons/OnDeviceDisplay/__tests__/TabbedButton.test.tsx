import * as React from 'react'
import {
  renderWithProviders,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TabbedButton } from '..'

const render = (props: React.ComponentProps<typeof TabbedButton>) => {
  return renderWithProviders(<TabbedButton {...props} />)[0]
}

describe('Background TabbedButton', () => {
  let props: React.ComponentProps<typeof TabbedButton>

  beforeEach(() => {
    props = {
      children: 'tabbed button',
    }
  })

  it('renders background tabbed button with text', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.highlightPurple_two)}`
    )
    expect(button).toHaveStyle(
      `padding: ${String(SPACING.spacing4)} ${String(SPACING.spacing5)}`
    )
    expect(button).toHaveStyle(`font-size: ${String(TYPOGRAPHY.fontSize22)}`)
    expect(button).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(button).toHaveStyle(
      `line-height: ${String(TYPOGRAPHY.lineHeight28)}`
    )
    expect(button).toHaveStyle(`border-radius: ${String(BORDERS.size_four)}`)
    expect(button).toHaveStyle(
      `text-transform: ${String(TYPOGRAPHY.textTransformNone)}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${String(COLORS.darkBlack_hundred)}`)
  })

  it('renders background tabbed button with text and disabled', () => {
    props.disabled = true
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: #16212d33`)
    expect(button).toHaveStyle(`color: #16212d99`)
  })

  it('applies the correct states to the background tabbed button - active', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.highlightPurple_two_pressed)}`,
      {
        modifier: ':active',
      }
    )
  })

  it('applies the correct states to the background tabbed button - focus', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule('box-shadow', 'none', {
      modifier: ':focus',
    })
  })

  it('applies the correct states to the background tabbed button - focus-visible', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.fundamentalsFocus)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })
})

describe('Foreground TabbedButton', () => {
  let props: React.ComponentProps<typeof TabbedButton>

  beforeEach(() => {
    props = {
      foreground: true,
      children: 'tabbed button',
    }
  })

  it('renders foreground tabbed button with text', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.highlightPurple_one)}`
    )
    expect(button).toHaveStyle(
      `padding: ${String(SPACING.spacing4)} ${String(SPACING.spacing5)}`
    )
    expect(button).toHaveStyle(`font-size: ${String(TYPOGRAPHY.fontSize22)}`)
    expect(button).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(button).toHaveStyle(
      `line-height: ${String(TYPOGRAPHY.lineHeight28)}`
    )
    expect(button).toHaveStyle(`border-radius: ${String(BORDERS.size_four)}`)
    expect(button).toHaveStyle(
      `text-transform: ${String(TYPOGRAPHY.textTransformNone)}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${String(COLORS.white)}`)
  })

  it('renders foreground tabbed button with text and disabled', () => {
    props.disabled = true
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: #16212d33`)
    expect(button).toHaveStyle(`color: #16212d99`)
  })

  it('applies the correct states to the foreground tabbed button - active', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.highlightPurple_one_pressed)}`,
      {
        modifier: ':active',
      }
    )
  })

  it('applies the correct states to the foreground tabbed button - focus', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule('box-shadow', 'none', {
      modifier: ':focus',
    })
  })

  it('applies the correct states to the foreground tabbed button - focus-visible', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.fundamentalsFocus)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })
})
