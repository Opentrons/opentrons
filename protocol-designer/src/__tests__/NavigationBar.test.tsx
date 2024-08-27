import * as React from 'react'
import { describe, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { i18n } from '../assets/localization'
import { renderWithProviders } from '../__testing-utils__'
import { NavigationBar } from '../NavigationBar'

vi.mock('../file-data/selectors')

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <NavigationBar />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('NavigationBar', () => {
  it('should render text and link button', () => {
    render()
    screen.getByText('Opentrons')
    screen.getByText('Protocol Designer')
    screen.getByText('Version # fake_PD_version')
    screen.getByText('Create new protocol')
    screen.getByText('Import')
  })

  it.todo(
    'when clicking Create new protocol, mock function should be called',
    () => {}
  )

  it.todo('when clicking Import, mock function should be called', () => {})
})
