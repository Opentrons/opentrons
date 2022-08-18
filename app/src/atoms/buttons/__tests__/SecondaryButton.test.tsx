import * as React from 'react'
import {
  renderWithProviders,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { SecondaryButton } from '..'

const render = (props: React.ComponentProps<typeof SecondaryButton>) => {
  return renderWithProviders(<SecondaryButton {...props} />)[0]
}

describe('SecondaryButton', () => {
  let props: React.ComponentProps<typeof SecondaryButton>

  beforeEach(() => {
    props = {
      children: 'secondary button',
    }
  })

  it('renders primary button with text', () => {
    const { getByText } = render(props)
    const button = getByText('secondary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.transparent}`)
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing3} ${SPACING.spacing4}`
    )
    expect(button).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSizeP}`)
    expect(button).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
    expect(button).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight20}`)
    expect(button).toHaveStyle(`border-radius: ${BORDERS.radiusSoftCorners}`)
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle(`color: ${COLORS.blueEnabled}`)
  })

  it('renders secondary button with text and disabled', () => {
    props.disabled = true
    const { getByText } = render(props)
    const button = getByText('secondary button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`opacity: 50%`)
  })

  it('applies the correct states to the button - hover', () => {
    const { getByText } = render(props)
    const button = getByText('secondary button')
    expect(button).toHaveStyleRule('opacity', '70%', {
      modifier: ':hover',
    })
    expect(button).toHaveStyleRule('box-shadow', '0 0 0', {
      modifier: ':hover',
    })
  })

  it('applies the correct states to the button - focus-visible', () => {
    const { getByText } = render(props)
    const button = getByText('secondary button')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${COLORS.warningEnabled}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it('renders secondary button with text and different background color', () => {
    props.color = COLORS.errorEnabled
    const { getByText } = render(props)
    const button = getByText('secondary button')
    expect(button).toHaveStyle(`color: ${COLORS.errorEnabled}`)
  })
})
