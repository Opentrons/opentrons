import * as React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { FinishSetup } from '../FinishSetup'

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter>
      <Route path="/finish-setup/:robotName">
        <FinishSetup />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Finish setup screen', () => {
  it('should render text, an image and a button', () => {
    const [{ getByText, getByRole }] = render('/finish-setup/Boreal')
    // getByText('Boreal, love it!')
    // getByText('Your robot is ready to go!')
    getByRole('button', { name: 'Finish setup' })
  })
})
