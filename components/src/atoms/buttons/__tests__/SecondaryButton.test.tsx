import 'jest-styled-components'
import * as React from 'react'
import { renderWithProviders } from '../../../testing/utils'
import {
  LEGACY_COLORS,
  BORDERS,
  TYPOGRAPHY,
  SPACING,
} from '../../../ui-style-constants'
import { COLORS } from '../../../helix-design-system'

import { SecondaryButton } from '../SecondaryButton'

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
      `padding: ${SPACING.spacing8} ${SPACING.spacing16}`
    )
    expect(button).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSizeP}`)
    expect(button).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
    expect(button).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight20}`)
    expect(button).toHaveStyle(`border-radius: ${BORDERS.radiusSoftCorners}`)
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle(`color: ${COLORS.blue50}`)
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
      `0 0 0 3px ${COLORS.yellow50}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it('renders secondary button with text and different background color', () => {
    props.color = COLORS.red50
    const { getByText } = render(props)
    const button = getByText('secondary button')
    expect(button).toHaveStyle(`color: ${COLORS.red50}`)
  })
})
