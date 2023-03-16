import * as React from 'react'
import {
  renderWithProviders,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { MediumButtonRounded } from '..'

const render = (props: React.ComponentProps<typeof MediumButtonRounded>) => {
  return renderWithProviders(<MediumButtonRounded {...props} />)[0]
}

describe('MediumButtonRounded', () => {
  let props: React.ComponentProps<typeof MediumButtonRounded>

  beforeEach(() => {
    props = {
      children: 'medium button rounded',
    }
  })

  it('renders medium button rounded with text', () => {
    const { getByText } = render(props)
    const button = getByText('medium button rounded')
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.blueEnabled)}`
    )
    expect(button).toHaveStyle(
      `padding: ${String(SPACING.spacing4)} ${String(SPACING.spacing6)}`
    )
    expect(button).toHaveStyle(`font-size: ${String(TYPOGRAPHY.fontSize28)}`)
    expect(button).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(button).toHaveStyle(
      `line-height: ${String(TYPOGRAPHY.lineHeight36)}`
    )
    expect(button).toHaveStyle(`border-radius: 60px`)
    expect(button).toHaveStyle(
      `text-transform: ${String(TYPOGRAPHY.textTransformNone)}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${String(COLORS.white)}`)
  })

  it('renders medium button rounded with text and disabled', () => {
    props.disabled = true
    const { getByText } = render(props)
    const button = getByText('medium button rounded')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: #16212d33`)
    expect(button).toHaveStyle(`color: #16212d99`)
  })

  it('applies the correct states to the medium button rounded - active', () => {
    const { getByText } = render(props)
    const button = getByText('medium button rounded')
    expect(button).toHaveStyleRule(
      'background-color',
      `${COLORS.blueEnabled}`,
      {
        modifier: ':active',
      }
    )
  })

  it('applies the correct states to the medium button rounded - focus-visible', () => {
    const { getByText } = render(props)
    const button = getByText('medium button rounded')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.fundamentalsFocus)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })
})
