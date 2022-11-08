import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
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
    const connectingScreen = getByText('Searching for network...')
    expect(connectingScreen).toHaveStyle(`background-color: D6D6D6`)
  })

  it('should render a spinner icon', () => {
    const [{ getByLabelText }] = render()
    expect(getByLabelText('spinner')).toBeInTheDocument()
  })
})
