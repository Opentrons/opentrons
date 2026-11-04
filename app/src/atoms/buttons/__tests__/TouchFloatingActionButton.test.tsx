import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { TouchFloatingActionButton } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TouchFloatingActionButton>) => {
  return renderWithProviders(<TouchFloatingActionButton {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TouchFloatingActionButton', () => {
  let props: ComponentProps<typeof TouchFloatingActionButton>

  beforeEach(() => {
    props = {
      buttonText: 'floating action',
      onClick: vi.fn(),
      'aria-label': 'This is test',
    }
  })

  it('renders floating action button with text - active', () => {
    render(props)
    screen.getByLabelText('This is test')
    screen.getByText('floating action')
  })

  it('renders unselected floating action button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
