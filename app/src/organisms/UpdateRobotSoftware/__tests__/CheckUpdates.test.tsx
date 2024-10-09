import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { CheckUpdates } from '../CheckUpdates'

const render = () =>
  renderWithProviders(<CheckUpdates />, {
    i18nInstance: i18n,
  })

describe('CheckUpdates', () => {
  it('should render text', () => {
    render()
    screen.getByText('Checking for updates')
  })
})
