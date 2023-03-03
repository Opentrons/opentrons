import * as React from 'react'
import {
  renderWithProviders,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { AlertSmallButton } from '..'

const render = (props: React.ComponentProps<typeof AlertSmallButton>) => {
  return renderWithProviders(<AlertSmallButton {...props} />)[0]
}

describe('AlertSmallButton', () => {
  let props: React.ComponentProps<typeof AlertSmallButton>

  beforeEach(() => {
    props = {
      children: 'alert small button',
    }
  })

  it('renders small button with text', () => {
    const { getByText } = render(props)
    const button = getByText('alert small button')
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.errorEnabled)}`
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
    expect(button).toHaveStyle(`border-radius: 12px`)
    expect(button).toHaveStyle(
      `text-transform: ${String(TYPOGRAPHY.textTransformNone)}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${String(COLORS.white)}`)
  })

  it('renders small button with text and disabled', () => {
    props.disabled = true
    const { getByText } = render(props)
    const button = getByText('alert small button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: #16212d33`)
    expect(button).toHaveStyle(`color: #16212d8c`)
  })

  it('applies the correct states to the small button - active', () => {
    const { getByText } = render(props)
    const button = getByText('alert small button')
    expect(button).toHaveStyleRule('background-color', '#e31e1e', {
      modifier: ':active',
    })
  })

  it('applies the correct states to the small button - focus-visible', () => {
    const { getByText } = render(props)
    const button = getByText('alert small button')
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.errorEnabled)}`
    )
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.fundamentalsFocus)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })
})
