import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { BORDERS, COLORS } from '../../../helix-design-system'
import { renderWithProviders } from '../../../testing/utils'
import { SPACING, TYPOGRAPHY } from '../../../ui-style-constants'
import { PrimaryButton } from '../PrimaryButton'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof PrimaryButton>) => {
  return renderWithProviders(<PrimaryButton {...props} />)[0]
}

describe('default variant', () => {
  let props: ComponentProps<typeof PrimaryButton>

  beforeEach(() => {
    props = {
      children: 'primary button',
    }
  })

  it('renders primary button with text', () => {
    render(props)
    const button = screen.getByText('primary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.blue50}`)
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing8} ${SPACING.spacing16}`
    )
    expect(button).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSizeH3}`)
    expect(button).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
    expect(button).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight20}`)
    expect(button).toHaveStyle(`border-radius: ${BORDERS.borderRadius8}`)
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: ${COLORS.white}`)
  })

  it('renders primary button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('primary button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: ${COLORS.grey30}`)
    expect(button).toHaveStyle(`color: ${COLORS.grey40}`)
  })

  it('applies the correct states to the button - hover', () => {
    render(props)
    const button = screen.getByText('primary button')
    fireEvent.mouseOver(button)
    expect(button).toHaveStyle(`background-color: ${COLORS.blue55}`)
  })

  it('renders primary button with text and different background color', () => {
    props.backgroundColor = COLORS.red50
    render(props)
    const button = screen.getByText('primary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.red50}`)
    expect(button).toHaveStyle(`color: ${COLORS.white}`)
  })
})

describe('warning variant', () => {
  let props: ComponentProps<typeof PrimaryButton>

  beforeEach(() => {
    props = {
      variant: 'warning',
      children: 'warning primary button',
    }
  })

  it.skip('renders warning primary button with text', () => {
    render(props)
    const button = screen.getByText('warning primary button')
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle('box-shadow: 0 0 0')
  })

  it('renders warning primary button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('warning primary button')
    expect(button).toBeDisabled()
  })
})

describe('alt variant', () => {
  let props: ComponentProps<typeof PrimaryButton>

  beforeEach(() => {
    props = {
      variant: 'alt',
      children: 'alt primary button',
    }
  })

  it('renders alt primary button with text', () => {
    render(props)
    const button = screen.getByText('alt primary button')
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    // expect(button).toHaveStyle(`box-shadow: none`)
  })

  it('renders alt primary button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('alt primary button')
    expect(button).toBeDisabled()
  })

  // (kk: 09/23/2024) hover test needs jsdom update so this will be activated later
  //   it('applies the correct states to the button - hover', () => {
  //     render(props)
  //     const button = screen.getByText('alt primary button')
  //     fireEvent.mouseOver(button)
  //     expect(button).toHaveStyle(`background-color: ${COLORS.grey35}`)
  //   })
})
