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

describe('Unselected TabbedButton', () => {
  let props: React.ComponentProps<typeof TabbedButton>

  beforeEach(() => {
    props = {
      children: 'tabbed button',
    }
  })

  it('renders unselected tabbed button with text', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.highlightPurple2)}`
    )
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(button).toHaveStyle(`font-size: ${String(TYPOGRAPHY.fontSize22)}`)
    expect(button).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(button).toHaveStyle(
      `line-height: ${String(TYPOGRAPHY.lineHeight28)}`
    )
    expect(button).toHaveStyle(
      `border-radius: ${String(BORDERS.borderRadiusSize4)}`
    )
    expect(button).toHaveStyle(
      `text-transform: ${String(TYPOGRAPHY.textTransformNone)}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${String(COLORS.darkBlack100)}`)
  })

  it('renders unselected tabbed button with text and disabled', () => {
    props.disabled = true
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: #16212d33`)
    expect(button).toHaveStyle(`color: #16212d99`)
  })

  it('applies the correct states to the unselected tabbed button - active', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.highlightPurple2Pressed)}`,
      {
        modifier: ':active',
      }
    )
  })

  it('applies the correct states to the unselected tabbed button - focus', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule('box-shadow', 'none', {
      modifier: ':focus',
    })
  })

  it('applies the correct states to the unselected tabbed button - focus-visible', () => {
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

describe('Selected TabbedButton', () => {
  let props: React.ComponentProps<typeof TabbedButton>

  beforeEach(() => {
    props = {
      isSelected: true,
      children: 'tabbed button',
    }
  })

  it('renders selected tabbed button with text', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.highlightPurple1)}`
    )
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(button).toHaveStyle(`font-size: ${String(TYPOGRAPHY.fontSize22)}`)
    expect(button).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(button).toHaveStyle(
      `line-height: ${String(TYPOGRAPHY.lineHeight28)}`
    )
    expect(button).toHaveStyle(
      `border-radius: ${String(BORDERS.borderRadiusSize4)}`
    )
    expect(button).toHaveStyle(
      `text-transform: ${String(TYPOGRAPHY.textTransformNone)}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${String(COLORS.white)}`)
  })

  it('renders selected tabbed button with text and disabled', () => {
    props.disabled = true
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: #16212d33`)
    expect(button).toHaveStyle(`color: #16212d99`)
  })

  it('applies the correct states to the selected tabbed button - active', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.highlightPurple1Pressed)}`,
      {
        modifier: ':active',
      }
    )
  })

  it('applies the correct states to the selected tabbed button - focus', () => {
    const { getByText } = render(props)
    const button = getByText('tabbed button')
    expect(button).toHaveStyleRule('box-shadow', 'none', {
      modifier: ':focus',
    })
  })

  it('applies the correct states to the selected tabbed button - focus-visible', () => {
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
