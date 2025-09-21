import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { BORDERS, COLORS } from '../../../helix-design-system'
import { renderWithProviders } from '../../../testing/utils'
import { SPACING, TYPOGRAPHY } from '../../../ui-style-constants'
import { AltPrimaryButton } from '../AltPrimaryButton'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof AltPrimaryButton>) => {
  return renderWithProviders(<AltPrimaryButton {...props} />)[0]
}

describe('AltPrimaryButton', () => {
  let props: ComponentProps<typeof AltPrimaryButton>

  beforeEach(() => {
    props = {
      children: 'alt primary button',
    }
  })

  it('renders alt primary button with text', () => {
    render(props)
    const button = screen.getByText('alt primary button')
    expect(button).toHaveStyle('background-color: var(--grey-30)')
    expect(button).toHaveStyle('font-weight: var(--font-weight-semi-bold)')
    expect(button).toHaveStyle('border-radius: var(--border-radius-8)')
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle('box-shadow: none')
    expect(button).toHaveStyle('color: var(--black-90)')
    expect(button).toHaveStyle(`font-size: var(--font-size-h3)`)
    expect(button).toHaveStyle(`font-weight: var(--font-weight-semi-bold)`)
    expect(button).toHaveStyle(`line-height: var(--line-height-20)`)
    expect(button).toHaveStyle(`border-radius: var(--border-radius-8)`)
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle(`box-shadow: none`)
    expect(button).toHaveStyle(`color: var(--black-90)`)
  })

  it('renders alt primary button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('alt primary button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle('background-color: var(--grey-30)')
    expect(button).toHaveStyle('color: var(--grey-40)')
  })

  // (kk: 09/23/2024) hover test needs jsdom update so this will be activated later
  //   it('applies the correct states to the button - hover', () => {
  //     render(props)
  //     const button = screen.getByText('alt primary button')
  //     fireEvent.mouseOver(button)
  //     expect(button).toHaveStyle(`background-color: ${COLORS.grey35}`)
  //   })
})
