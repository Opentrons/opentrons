import * as React from 'react'
import {
  renderWithProviders,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { PrimaryButton } from '..'

const render = (props: React.ComponentProps<typeof PrimaryButton>) => {
  return renderWithProviders(<PrimaryButton {...props} />)[0]
}

describe('PrimaryButton', () => {
  let props: React.ComponentProps<typeof PrimaryButton>

  beforeEach(() => {
    props = {
      children: 'primary button',
    }
  })

  it('renders primary button with text', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.blueEnabled)}`
    )
    expect(button).toHaveStyle(
      `padding: ${String(SPACING.spacing3)} ${String(
        SPACING.spacing4
      )} ${String(SPACING.spacing3)} ${String(SPACING.spacing4)}`
    )
    expect(button).toHaveStyle(`font-size: ${String(TYPOGRAPHY.fontSizeP)}`)
    expect(button).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(button).toHaveStyle(
      `line-height: ${String(TYPOGRAPHY.lineHeight20)}`
    )
    expect(button).toHaveStyle(
      `border-radius: ${String(BORDERS.radiusSoftCorners)}`
    )
    expect(button).toHaveStyle(
      `text-transform: ${String(TYPOGRAPHY.textTransformNone)}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${String(COLORS.white)}`)
  })

  it('renders primary button with text and disabled', () => {
    props.disabled = true
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.darkGreyDisabled)}`
    )
    expect(button).toHaveStyle(`color: ${String(COLORS.errorDisabled)}`)
  })

  it('applies the correct states to the button - focus', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.blueHover)}`,
      {
        modifier: ':focus',
      }
    )
  })

  it('applies the correct states to the button - hover', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.blueHover)}`,
      {
        modifier: ':hover',
      }
    )
  })

  it('applies the correct states to the button - active', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.bluePressed)}`,
      {
        modifier: ':active',
      }
    )
  })

  it('applies the correct states to the button - focus-visible', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.warningEnabled)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it('renders primary button with text and different background color', () => {
    props.backgroundColor = COLORS.errorEnabled
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.errorEnabled)}`
    )
    expect(button).toHaveStyle(`color: ${String(COLORS.white)}`)
  })
})
