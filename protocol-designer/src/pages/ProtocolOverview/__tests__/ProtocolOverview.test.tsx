import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../localization'
import { ProtocolOverview } from '../index'
import { fireEvent, screen } from '@testing-library/react'

import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = () => {
  return renderWithProviders(<ProtocolOverview />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolOverview', () => {
  beforeEach(() => {})
  it('renders the deck setup component when the button is clicked', () => {
    render()
    fireEvent.click(screen.getByText('go to deck setup'))
    expect(mockNavigate).toHaveBeenCalled()
  })
})
