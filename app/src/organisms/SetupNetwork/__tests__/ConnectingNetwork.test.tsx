import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { ConnectingNetwork } from '../ConnectingNetwork'

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ConnectingNetwork />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConnectingNetwork', () => {
  it('should render connecting screen with background color', () => {
    // Note the colors would be changed in the future
    const [{ getByText }] = render()
    const connectingScreen = getByText('Connecting...')
    expect(connectingScreen).toHaveStyle(`background-color: D6D6D6`)
  })

  it('should render a spinner icon', () => {
    const [{ getByLabelText }] = render()
    expect(getByLabelText('spinner')).toBeInTheDocument()
  })
})
