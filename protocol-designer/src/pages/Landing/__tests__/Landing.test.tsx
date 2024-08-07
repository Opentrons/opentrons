import * as React from 'react'

import { describe, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { i18n } from '../../../localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { loadProtocolFile } from '../../../load-file/actions'
import { Landing } from '../index'

vi.mock('../../../load-file/actions')

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('Landing', () => {
  beforeEach(() => {
    vi.mocked(loadProtocolFile).mockReturnValue(vi.fn())
  })
  it('renders the landing page image and text', () => {
    render()
    screen.getByLabelText('welcome image')
    screen.getByText('Welcome to Protocol Designer')
    screen.getByText(
      'A no-code solution to create protocols that x, y and z meaning for your lab and workflow.'
    )
    screen.getByRole('button', { name: 'Create new' })
    screen.getByText('Import existing protocol')
  })
})
