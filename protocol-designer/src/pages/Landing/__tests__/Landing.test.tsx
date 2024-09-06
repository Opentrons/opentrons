import * as React from 'react'

import { describe, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { loadProtocolFile } from '../../../load-file/actions'
import { getFileMetadata } from '../../../file-data/selectors'
import { Landing } from '../index'

vi.mock('../../../load-file/actions')
vi.mock('../../../file-data/selectors')

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
    vi.mocked(getFileMetadata).mockReturnValue({ created: 123 })
    vi.mocked(loadProtocolFile).mockReturnValue(vi.fn())
  })
  it('renders the landing page image and text', () => {
    render()
    screen.getByLabelText('welcome image')
    screen.getByText('Welcome to Protocol Designer')
    screen.getByText(
      'The easiest way to automate liquid handling on your Opentrons robot. No code required.'
    )
    screen.getByRole('button', { name: 'Create a protocol' })
    screen.getByText('Edit existing protocol')
    screen.getByRole('img', { name: 'welcome image' })
  })
})
