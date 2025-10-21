import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { TipPickupContainer } from '../TipPickupContainer'

const render = () => {
  return renderWithProviders(<TipPickupContainer />, {
    i18nInstance: i18n,
  })
}

describe('TipPickupContainer', () => {
  it('render text', () => {
    render()
    screen.getByText('Tip pickup')
    screen.getByText('tip rack name')
    screen.getByText('Tips remaining')
    screen.getByText('10 tips')
  })
})
