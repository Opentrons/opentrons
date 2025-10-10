import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '../../../testing/utils'
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
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  it('renders alt primary button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('alt primary button')
    expect(button).toBeDisabled()
  })
})
