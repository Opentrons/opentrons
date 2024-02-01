import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { BackButton } from '..'

const render = (props?: React.HTMLProps<HTMLButtonElement>) => {
  return renderWithProviders(
    <MemoryRouter
      initialEntries={['/previous-page', '/current-page']}
      initialIndex={1}
    >
      <BackButton {...props} />
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
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders a button that says Back', () => {
    const { getByRole } = render()
    getByRole('button', { name: 'Back' })
  })

  it('calls provided on click handler and does not go back one page', () => {
    const mockOnClick = jest.fn()

    render({ onClick: mockOnClick })

    expect(mockOnClick).toBeCalledTimes(0)
    screen.getByText('this is the current page')
    expect(screen.queryByText('this is the previous page')).toBeNull()
    fireEvent.click(screen.getByText('Back'))
    expect(mockOnClick).toBeCalledTimes(1)
    screen.getByText('this is the current page')
    expect(screen.queryByText('this is the previous page')).toBeNull()
  })

  it('goes back one page in history on click if no on click handler provided', () => {
    render()

    screen.getByText('this is the current page')
    expect(screen.queryByText('this is the previous page')).toBeNull()
    fireEvent.click(screen.getByText('Back'))
    screen.getByText('this is the previous page')
    expect(screen.queryByText('this is the current page')).toBeNull()
  })
})
