import { screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
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
    vi.resetAllMocks()
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
