import * as React from 'react'
import {
  renderWithProviders,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { AlertPrimaryButton } from '..'

const render = (props: React.ComponentProps<typeof AlertPrimaryButton>) => {
  return renderWithProviders(<AlertPrimaryButton {...props} />)[0]
}

describe('AlertPrimaryButton', () => {
  let props: React.ComponentProps<typeof AlertPrimaryButton>
  it('renders alert primary button with text', () => {
    props = {
      children: 'alert primary button',
    }
    const { getByText } = render(props)
    const button = getByText('alert primary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.errorEnabled}`)
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
    expect(button).toHaveStyle('box-shadow: 0 0 0')
  })

  it('renders alert primary button with text and disabled', () => {
    props = {
      children: 'alert primary button',
      disabled: true,
    }
    const { getByText } = render(props)
    const button = getByText('alert primary button')
    expect(button).toBeDisabled()
  })

  it('applies the correct states to the button - hover', () => {
    props = {
      children: 'alert primary button',
    }
    const { getByText } = render(props)
    const button = getByText('alert primary button')
    expect(button).toHaveStyleRule('box-shadow', '0 0 0', {
      modifier: ':hover',
    })
  })

  it('renders alert primary button with text and different background color', () => {
    props = {
      children: 'alert primary button',
      backgroundColor: COLORS.errorEnabled,
    }
    const { getByText } = render(props)
    const button = getByText('alert primary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.errorEnabled}`)
    expect(button).toHaveStyle(`color: ${COLORS.white}`)
  })
})
