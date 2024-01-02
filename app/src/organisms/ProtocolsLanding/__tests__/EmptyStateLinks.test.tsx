import * as React from 'react'
import { screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { EmptyStateLinks } from '../EmptyStateLinks'

describe('EmptyStateLinks', () => {
  const render = () => {
    return renderWithProviders(
      <BrowserRouter>
        <EmptyStateLinks title="Don't have a protocol yet?" />
      </BrowserRouter>,
      {
        i18nInstance: i18n,
      }
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct contents for empty state', () => {
    render()
    expect(screen.getByRole('complementary')).toHaveTextContent(
      /Don't have a protocol yet\?/i
    )

    screen.getByRole('link', { name: 'Open Protocol Library' })
    screen.getByRole('link', { name: 'Open Protocol Designer' })
    screen.getByRole('link', { name: 'Open Python API Documentation' })
  })
})
