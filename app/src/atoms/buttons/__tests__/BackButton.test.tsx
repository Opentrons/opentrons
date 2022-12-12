import * as React from 'react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { BackButton } from '..'

const render = () => {
  return renderWithProviders(
    <MemoryRouter
      initialEntries={['/previous-page', '/current-page']}
      initialIndex={1}
    >
      <BackButton />
      <Switch>
        <Route exact path="/current-page">
          this is the current page
        </Route>
        <Route exact path="/previous-page">
          this is the previous page
        </Route>
      </Switch>
    </MemoryRouter>,
    { i18nInstance: i18n }
  )[0]
}

describe('BackButton', () => {
  it('renders a button that says Back', () => {
    const { getByRole } = render()
    getByRole('button', { name: 'Back' })
  })

  it('goes back one page in history on click', () => {
    const { getByText, queryByText } = render()

    getByText('this is the current page')
    expect(queryByText('this is the previous page')).toBeNull()
    getByText('Back').click()
    getByText('this is the previous page')
    expect(queryByText('this is the current page')).toBeNull()
  })
})
