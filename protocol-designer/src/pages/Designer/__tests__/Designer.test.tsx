import * as React from 'react'

import { describe, it, vi, beforeEach, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { getFileMetadata } from '../../../file-data/selectors'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { DeckSetupContainer } from '../DeckSetup'
import { Designer } from '../index'
import { LiquidsOverflowMenu } from '../LiquidsOverflowMenu'

import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('../LiquidsOverflowMenu')
vi.mock('../DeckSetup')
vi.mock('../../../file-data/selectors')
vi.mock('../../../top-selectors/labware-locations')
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
      <Designer />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('Designer', () => {
  beforeEach(() => {
    vi.mocked(getFileMetadata).mockReturnValue({
      protocolName: 'mockProtocolName',
    })
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      modules: {},
      additionalEquipmentOnDeck: {},
      labware: {},
      pipettes: {},
    })
    vi.mocked(DeckSetupContainer).mockReturnValue(
      <div>mock DeckSetupContainer</div>
    )
    vi.mocked(LiquidsOverflowMenu).mockReturnValue(
      <div>mock LiquidsOverflowMenu</div>
    )
  })

  it('renders deck setup container and nav buttons', () => {
    render()
    screen.getByText('mock DeckSetupContainer')
    screen.getByText('mockProtocolName')
    screen.getByText('Edit protocol')
    screen.getByText('Protocol steps')
    screen.getByText('Protocol starting deck')
    screen.getByText('Liquids')
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(mockNavigate).toHaveBeenCalledWith('/overview')
  })

  it('renders the liquids button overflow menu', () => {
    render()
    fireEvent.click(screen.getByText('Liquids'))
    screen.getByText('mock LiquidsOverflowMenu')
  })

  it.todo('renders the protocol steps page')
})
