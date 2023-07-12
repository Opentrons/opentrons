import * as React from 'react'

import { COLORS, renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { DisplaySearchNetwork } from '../DisplaySearchNetwork'

const render = () => {
  return renderWithProviders(<DisplaySearchNetwork />, {
    i18nInstance: i18n,
  })
}

describe('SearchNetwork', () => {
  it('should render search screen with background', () => {
    const [{ getByText, getByTestId }] = render()
    getByText('Searching for networks...')
    expect(getByTestId('Display-Search-Network-text')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })
})
