import * as React from 'react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { EmptyStateLinks } from '../EmptyStateLinks'

describe('EmptyStateLinks', () => {
  let render: () => ReturnType<typeof renderWithProviders>[0]

  beforeEach(() => {
    render = () => {
      return renderWithProviders(
        <BrowserRouter>
          <EmptyStateLinks />
        </BrowserRouter>,
        {
          i18nInstance: i18n,
        }
      )[0]
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct contents for empty state', () => {
    const { getByRole } = render()
    expect(getByRole('complementary')).toHaveTextContent(
      /Don't have a protocol yet\?/i
    )

    expect(
      getByRole('link', { name: 'Launch Opentrons Protocol Library' })
    ).toBeTruthy()
    expect(
      getByRole('link', { name: 'Launch Opentrons Protocol Designer' })
    ).toBeTruthy()
    expect(
      getByRole('link', { name: 'Open Python API Documentation' })
    ).toBeTruthy()
  })
})
