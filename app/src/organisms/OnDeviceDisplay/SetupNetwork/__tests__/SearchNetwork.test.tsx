import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { MemoryRouter } from 'react-router-dom'

import { i18n } from '../../../../i18n'
import { SearchNetwork } from '../SearchNetwork'

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <SearchNetwork />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SearchNetwork', () => {
  it('should render search screen with background', () => {
    const [{ getByText }] = render()
    const connectingScreen = getByText('Searching for networks...')
    expect(connectingScreen).toHaveStyle(`background-color: D6D6D6`)
  })
})
