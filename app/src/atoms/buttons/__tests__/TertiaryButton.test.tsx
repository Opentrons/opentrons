import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import '@testing-library/jest-dom/vitest'

import { TertiaryButton } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TertiaryButton>) => {
  return renderWithProviders(<TertiaryButton {...props} />)[0]
}

describe('TertiaryButton', () => {
  let props: ComponentProps<typeof TertiaryButton>

  beforeEach(() => {
    props = {
      children: 'tertiary button',
    }
  })
  it('renders tertiary button with text', () => {
    render(props)
    screen.getByText('tertiary button')
  })

  it('renders tertiary button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('tertiary button')
    expect(button).toBeDisabled()
  })
})
