import * as React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { COLORS, SPACING, TYPOGRAPHY, BORDERS } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'

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

  it('renders secondary tertiary button with text - active', () => {
    render(props)
    const button = screen.getByText('secondary tertiary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(button).toHaveStyle(`border-radius: ${BORDERS.borderRadiusFull}`)
    expect(button).toHaveStyle('box-shadow: 0 0 0')
    expect(button).toHaveStyle(`color: ${COLORS.blue50}`)
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing8} ${SPACING.spacing16} ${SPACING.spacing8} ${SPACING.spacing16}`
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
    props.disabled = true
    render(props)
    const button = screen.getByText('secondary tertiary button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle('opacity: 50%')
  })

  it('applies the correct states to the button - hover', () => {
    render(props)
    const button = screen.getByText('secondary tertiary button')
    fireEvent.mouseOver(button)
    expect(button).toHaveStyle('opacity: 70%')
    expect(button).toHaveStyle('box-shadow: 0 0 0')
  })

  it('renders secondary tertiary button with text and different background color', () => {
    props.color = COLORS.red50
    render(props)
    const button = screen.getByText('secondary tertiary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(button).toHaveStyle(`color: ${COLORS.red50}`)
  })
})
