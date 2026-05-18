import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { SettingsIcon } from '/protocol-designer/components/organisms/SettingsIcon'
import { getHasUnsavedChanges } from '/protocol-designer/load-file/selectors'

import { Navigation } from '..'

import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('/protocol-designer/components/organisms/SettingsIcon')
vi.mock('/protocol-designer/navigation/actions')
vi.mock('/protocol-designer/file-data/selectors')
vi.mock('/protocol-designer/load-file/selectors')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Navigation />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('Navigation', () => {
  beforeEach(() => {
    vi.mocked(getHasUnsavedChanges).mockReturnValue(false)
    vi.mocked(SettingsIcon).mockReturnValue(<div>mock SettingsIcon</div>)
  })
  it('should render text and link button', () => {
    render()
    screen.getByText('Opentrons')
    screen.getByText('Protocol Designer')
    screen.getByText('Create new')
    screen.getByText('Import')
    screen.getByText('mock SettingsIcon')
  })

  it('when clicking Create new, should call the toggle action', () => {
    render()
    fireEvent.click(screen.getByText('Create new'))
    expect(mockNavigate).toHaveBeenCalled()
  })

  it.todo('when clicking Import, mock function should be called', () => {})
})
