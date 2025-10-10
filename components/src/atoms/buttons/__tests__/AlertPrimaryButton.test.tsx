import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '../../../testing/utils'
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
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  it('renders alert primary button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('alert primary button')
    expect(button).toBeDisabled()
  })
})
