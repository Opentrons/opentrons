import 'jest-styled-components'
import * as React from 'react'
import {
  renderWithProviders,
  LEGACY_COLORS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { QuaternaryButton } from '..'

const render = (props: React.ComponentProps<typeof QuaternaryButton>) => {
  return renderWithProviders(<QuaternaryButton {...props} />)[0]
}

describe('QuaternaryButton', () => {
  let props: React.ComponentProps<typeof QuaternaryButton>

  beforeEach(() => {
    props = {
      children: 'secondary tertiary button',
    }
  })

  it('renders secondary tertiary button with text', () => {
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyle(`background-color: ${String(COLORS.white)}`)
    expect(button).toHaveStyle(
      `border-radius: ${String(BORDERS.radiusRoundEdge)}`
    )
    expect(button).toHaveStyle('box-shadow: none')
    expect(button).toHaveStyle(`color: ${String(LEGACY_COLORS.blueEnabled)}`)
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing8} ${SPACING.spacing16} ${SPACING.spacing8} ${SPACING.spacing16}`
    )
    expect(button).toHaveStyle(
      `text-transform: ${String(TYPOGRAPHY.textTransformNone)}`
    )
    expect(button).toHaveStyle('white-space: nowrap')
    expect(button).toHaveStyle(`font-size: ${String(TYPOGRAPHY.fontSizeLabel)}`)
    expect(button).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(button).toHaveStyle(
      `line-height: ${String(TYPOGRAPHY.lineHeight12)}`
    )
  })

  it('renders secondary tertiary button with text and disabled', () => {
    props.disabled = true
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle('opacity: 50%')
  })

  it('applies the correct states to the button - hover', () => {
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
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.yellow50)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it('renders secondary tertiary button with text and different background color', () => {
    props.color = LEGACY_COLORS.errorEnabled
    const { getByText } = render(props)
    const button = getByText('secondary tertiary button')
    expect(button).toHaveStyle(`background-color: ${String(COLORS.white)}`)
    expect(button).toHaveStyle(`color: ${String(LEGACY_COLORS.errorEnabled)}`)
  })
})
