import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { QuaternaryButton } from '..'

import type { ComponentProps } from 'react'

vi.mock('styled-components', async () => {
  const actual = await vi.importActual(
    'styled-components/dist/styled-components.browser.esm.js'
  )
  return actual
})

const render = (props: ComponentProps<typeof QuaternaryButton>) => {
  return renderWithProviders(<QuaternaryButton {...props} />)[0]
}

describe('QuaternaryButton', () => {
  let props: ComponentProps<typeof QuaternaryButton>

  beforeEach(() => {
    props = {
      children: 'secondary tertiary button',
    }
  })

  it('renders secondary tertiary button with text - active', () => {
    render(props)
    screen.getByText('secondary tertiary button')
  })

  it('renders secondary tertiary button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('secondary tertiary button')
    expect(button).toBeDisabled()
  })
})
