import * as React from 'react'
import {
  renderWithProviders,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { SecondaryTertiaryButton } from '..'

const render = (
  props: React.ComponentProps<typeof SecondaryTertiaryButton>
) => {
  return renderWithProviders(<SecondaryTertiaryButton {...props} />)[0]
}

describe('SecondaryTertiaryButton', () => {
  let props: React.ComponentProps<typeof SecondaryTertiaryButton>
  it('renders secondary tertiary button with text', () => {
    props = {
      children: 'secondary tertiary button',
    }
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(button).toHaveStyle(`border-radius: ${BORDERS.radiusRoundEdge}`)
    expect(button).toHaveStyle('box-shadow: none')
    expect(button).toHaveStyle(`color: ${COLORS.blueEnabled}`)
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing3} ${SPACING.spacing4}`
    )
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle('white-space: nowrap')
    expect(button).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSizeLabel}`)
    expect(button).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
    expect(button).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight12}`)
  })

  it('renders secondary tertiary button with text and disabled', () => {
    props = {
      children: 'secondary tertiary button',
      disabled: true,
    }
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle('opacity: 50%')
  })

  it('applies the correct states to the button - hover', () => {
    props = {
      children: 'secondary tertiary button',
    }
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyleRule('opacity', '70%', {
      modifier: ':hover',
    })
    expect(button).toHaveStyleRule('box-shadow', '0 0 0', {
      modifier: ':hover',
    })
  })

  it('applies the correct states to the button - focus-visible', () => {
    props = {
      children: 'secondary tertiary button',
    }
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${COLORS.warningEnabled}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it('renders secondary tertiary button with text and different background color', () => {
    props = {
      children: 'secondary tertiary button',
      color: COLORS.errorEnabled,
    }
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(button).toHaveStyle(`color: ${COLORS.errorEnabled}`)
  })
})
