import 'jest-styled-components'
import * as React from 'react'
import { renderWithProviders } from '../../../testing/utils'
import { COLORS } from '../../../helix-design-system'
import { BORDERS, TYPOGRAPHY, SPACING } from '../../../ui-style-constants'
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
    expect(button).toHaveStyle(`background-color: ${COLORS.blue50}`)
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
    expect(button).toHaveStyle(`background-color: ${COLORS.grey30}`)
    expect(button).toHaveStyle(`color: ${COLORS.grey40}`)
  })

  it('applies the correct states to the button - focus', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule('background-color', `${COLORS.blue55}`, {
      modifier: ':focus',
    })
  })

  it('applies the correct states to the button - hover', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule('background-color', `${COLORS.blue55}`, {
      modifier: ':hover',
    })
  })

  it('applies the correct states to the button - active', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule('background-color', `${COLORS.blue60}`, {
      modifier: ':active',
    })
  })

  it('applies the correct states to the button - focus-visible', () => {
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${COLORS.yellow50}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it('renders primary button with text and different background color', () => {
    props.backgroundColor = COLORS.red50
    const { getByText } = render(props)
    const button = getByText('primary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.red50}`)
    expect(button).toHaveStyle(`color: ${COLORS.white}`)
  })
})
