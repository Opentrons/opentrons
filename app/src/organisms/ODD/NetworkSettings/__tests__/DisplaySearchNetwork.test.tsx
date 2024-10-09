import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { DisplaySearchNetwork } from '../DisplaySearchNetwork'

const render = () => {
  return renderWithProviders(<DisplaySearchNetwork />, {
    i18nInstance: i18n,
  })
}

describe('SearchNetwork', () => {
  it('should render search screen with background', () => {
    render()
    screen.getByText('Searching for networks...')
    expect(screen.getByTestId('Display-Search-Network-text')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })
})
