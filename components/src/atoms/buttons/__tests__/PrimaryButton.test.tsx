import 'jest-styled-components'
import * as React from 'react'
import { renderWithProviders } from '../../../testing/utils'
import {
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  SPACING,
} from '../../../ui-style-constants'
import { COLORS } from '../../../helix-design-system'
import { PrimaryButton } from '../PrimaryButton'

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
    expect(button).toHaveStyle(`background-color: ${COLORS.blueEnabled}`)
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing8} ${SPACING.spacing16} ${SPACING.spacing8} ${SPACING.spacing16}`
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

  it('renders primary button with text and disabled', () => {
    props.disabled = true
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: ${COLORS.grey50Disabled}`)
    expect(button).toHaveStyle(`color: ${COLORS.grey40}`)
  })

  it('applies the correct states to the button - focus', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule('background-color', `${COLORS.blueHover}`, {
      modifier: ':focus',
    })
  })

  it('applies the correct states to the button - hover', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule('background-color', `${COLORS.blueHover}`, {
      modifier: ':hover',
    })
  })

  it('applies the correct states to the button - active', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${COLORS.bluePressed}`,
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
      `0 0 0 3px ${COLORS.warningEnabled}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it('renders primary button with text and different background color', () => {
    props.backgroundColor = COLORS.errorEnabled
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.errorEnabled}`)
    expect(button).toHaveStyle(`color: ${COLORS.white}`)
  })
})
