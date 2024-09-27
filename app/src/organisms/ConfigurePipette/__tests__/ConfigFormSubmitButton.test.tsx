import type * as React from 'react'
import { it, expect, describe, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ConfigFormSubmitButton } from '../ConfigFormSubmitButton'

const render = (props: React.ComponentProps<typeof ConfigFormSubmitButton>) => {
  return renderWithProviders(<ConfigFormSubmitButton {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfigFormSubmitButton', () => {
  let props: React.ComponentProps<typeof ConfigFormSubmitButton>
  beforeEach(() => {
    props = {
      disabled: false,
      formId: 'id',
    }
  })

  it('renders bottom button text and is not disabled', () => {
    render(props)
    screen.getByRole('button', { name: 'Confirm' })
  })
  it('renders bottom button text and disabled', () => {
    props = {
      disabled: true,
      formId: 'id',
    }
    render(props)
    const button = screen.getByRole('button', { name: 'Confirm' })
    expect(button).toBeDisabled()
  })
})
