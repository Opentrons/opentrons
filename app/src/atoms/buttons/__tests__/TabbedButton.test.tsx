import * as React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'

import { TabbedButton } from '..'

const render = (props: React.ComponentProps<typeof TabbedButton>) => {
  return renderWithProviders(<TabbedButton {...props} />)[0]
}

describe('Unselected TabbedButton', () => {
  let props: React.ComponentProps<typeof TabbedButton>

  beforeEach(() => {
    props = {
      children: 'tabbed button',
    }
  })

  it('renders unselected tabbed button with text', () => {
    render(props)
    const button = screen.getByText('tabbed button')
    expect(button).toHaveStyle(`background-color: ${COLORS.purple35}`)
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(button).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSize22}`)
    expect(button).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
    expect(button).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight28}`)
    expect(button).toHaveStyle(`border-radius: ${BORDERS.borderRadius16}`)
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${COLORS.black90}`)
  })

  it('renders unselected tabbed button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('tabbed button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: ${COLORS.grey35}`)
    expect(button).toHaveStyle(`color: ${COLORS.grey50}`)
  })

  it('applies the correct states to the unselected tabbed button - focus', () => {
    render(props)
    const button = screen.getByText('tabbed button')
    fireEvent.focus(button)
    expect(button).toHaveStyle('box-shadow: none')
  })
})

describe('Selected TabbedButton', () => {
  let props: React.ComponentProps<typeof TabbedButton>

  beforeEach(() => {
    props = {
      isSelected: true,
      children: 'tabbed button',
    }
  })

  it('renders selected tabbed button with text', () => {
    render(props)
    const button = screen.getByText('tabbed button')
    expect(button).toHaveStyle(`background-color: ${COLORS.purple50}`)
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(button).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSize22}`)
    expect(button).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
    expect(button).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight28}`)
    expect(button).toHaveStyle(`border-radius: ${BORDERS.borderRadius16}`)
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${COLORS.white}`)
  })

  it('renders selected tabbed button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('tabbed button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: ${COLORS.grey35}`)
    expect(button).toHaveStyle(`color: ${COLORS.grey50}`)
  })

  it('applies the correct states to the selected tabbed button - focus', () => {
    render(props)
    const button = screen.getByText('tabbed button')
    fireEvent.focus(button)

    expect(button).toHaveStyle('box-shadow: none')
  })
})
