import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { renderWithProviders } from '../../../__testing-utils__'
import { FloatingActionButton } from '..'

const render = (props: React.ComponentProps<typeof FloatingActionButton>) => {
  return renderWithProviders(<FloatingActionButton {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FloatingActionButton', () => {
  let props: React.ComponentProps<typeof FloatingActionButton>

  beforeEach(() => {
    props = {
      buttonText: 'floating action',
      onClick: vi.fn(),
    }
  })

  it('renders floating action button with text - active', () => {
    const { getByRole } = render(props)
    const button = getByRole('button')
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing12} ${SPACING.spacing24}`
    )
    expect(button).toHaveStyle(`background-color: ${COLORS.purple55}`)
    expect(button).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSize28}`)
    expect(button).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
    expect(button).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight36}`)
    expect(button).toHaveStyle(`border-radius: ${BORDERS.borderRadius40}`)
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle(`box-shadow: ${BORDERS.shadowBig}`)
    expect(button).toHaveStyle(`color: ${COLORS.white}`)
  })

  it('renders unselected floating action button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(`background-color: ${COLORS.grey35}`)
    expect(button).toHaveStyle(`color: ${COLORS.grey50}`)
  })

  it('applies the correct states to the unselected floating action button - active', () => {
    render(props)
    const button = screen.getByRole('button')
    fireEvent.mouseLeave(button)
    expect(button).toHaveStyle(`background-color : ${COLORS.purple55}`)
  })
})
