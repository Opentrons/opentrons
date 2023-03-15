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

  it('applies the correct states to the background tabbed button - active', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.highlightPurple_two)}`,
      {
        modifier: ':active',
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

  it('applies the correct states to the foreground tabbed button - active', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.highlightPurple_one)}`,
      {
        modifier: ':active',
      }
    )
  })
})
