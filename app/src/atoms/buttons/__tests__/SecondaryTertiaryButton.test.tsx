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
    expect(button).toHaveStyle(`background-color: ${COLORS.blueEnabled}`)
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
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${COLORS.white}`)
  })

  it('renders secondary tertiary button with text and disabled', () => {
    props = {
      children: 'secondary tertiary button',
      disabled: true,
    }
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: ${COLORS.darkGreyDisabled}`)
    expect(button).toHaveStyle(`color: ${COLORS.errorDisabled}`)
  })

  it('applies the correct states to the button - focus', () => {
    props = {
      children: 'secondary tertiary button',
    }
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyleRule('background-color', `${COLORS.blueHover}`, {
      modifier: ':focus',
    })
  })

  it('applies the correct states to the button - hover', () => {
    props = {
      children: 'secondary tertiary button',
    }
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyleRule('background-color', `${COLORS.blueHover}`, {
      modifier: ':hover',
    })
  })

  it('applies the correct states to the button - active', () => {
    props = {
      children: 'secondary tertiary button',
    }
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${COLORS.bluePressed}`,
      {
        modifier: ':active',
      }
    )
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
      backgroundColor: COLORS.errorEnabled,
    }
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.errorEnabled}`)
    expect(button).toHaveStyle(`color: ${COLORS.white}`)
  })
})
