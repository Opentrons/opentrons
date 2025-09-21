import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '../../../testing/utils'
import { TYPOGRAPHY } from '../../../ui-style-constants'
import { AlertPrimaryButton } from '../AlertPrimaryButton'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof AlertPrimaryButton>) => {
  return renderWithProviders(<AlertPrimaryButton {...props} />)[0]
}

describe('AlertPrimaryButton', () => {
  let props: ComponentProps<typeof AlertPrimaryButton>

  beforeEach(() => {
    props = {
      children: 'alert primary button',
    }
  })

  it('renders alert primary button with text', () => {
    render(props)
    const button = screen.getByText('alert primary button')
    expect(button).toHaveStyle('background-color: var(--red-50)')
    expect(button).toHaveStyle('font-weight: var(--font-weight-semi-bold)')
    expect(button).toHaveStyle('border-radius: var(--border-radius-8)')
    expect(button).toHaveStyle(
      `text-transform: ${TYPOGRAPHY.textTransformNone}`
    )
    expect(button).toHaveStyle('box-shadow: 0 0 0')
  })

  it('renders alert primary button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('alert primary button')
    expect(button).toBeDisabled()
  })
})
