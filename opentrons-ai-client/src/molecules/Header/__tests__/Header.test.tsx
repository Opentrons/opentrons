import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { Header } from '../index'
import { describe, it } from 'vitest'
import { screen } from '@testing-library/react'

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<Header />, {
    i18nInstance: i18n,
  })
}

describe('Header', () => {
  it('should render Header component', () => {
    render()
    screen.getByText('Opentrons')
  })

  it('should render log out button', () => {
    render()
    screen.getByText('Log out')
  })
})
