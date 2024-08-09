import * as React from 'react'
import { describe, it, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../localization'
import { DeckSetup } from '../DeckSetup'
import { ProtocolOverview } from '../index'
import { fireEvent, screen } from '@testing-library/react'

vi.mock('../DeckSetup')

const render = () => {
  return renderWithProviders(<ProtocolOverview />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolOverview', () => {
  beforeEach(() => {
    vi.mocked(DeckSetup).mockReturnValue(<div>mock DeckSetup</div>)
  })
  it('renders the deck setup component when the button is clicked', () => {
    render()
    fireEvent.click(screen.getByText('go to deck setup'))
    screen.getByText('mock DeckSetup')
  })
})
