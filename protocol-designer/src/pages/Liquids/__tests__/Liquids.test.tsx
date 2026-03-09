import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Liquids } from '..'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { AssignLiquidsModal } from '../../../components/organisms'
import { LiquidsOverflowMenu } from '../../../components/organisms/LiquidsOverflowMenu'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'

import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('../../../components/organisms/LiquidsOverflowMenu')
vi.mock('../../../components/organisms')
vi.mock('../../../labware-ingred/selectors')
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
      <Liquids />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('Liquids', () => {
  beforeEach(() => {
    vi.mocked(labwareIngredSelectors.getSelectedLabwareId).mockReturnValue(
      'mockId'
    )
    vi.mocked(AssignLiquidsModal).mockReturnValue(
      <div>mock AssignLiquidsModal</div>
    )
    vi.mocked(LiquidsOverflowMenu).mockReturnValue(
      <div>mock LiquidsOverflowMenu</div>
    )
  })
  it('calls navigate when there is no active labware', () => {
    vi.mocked(labwareIngredSelectors.getSelectedLabwareId).mockReturnValue(null)
    render()
    expect(mockNavigate).toHaveBeenCalledWith('/designer')
  })

  it('renders assign liquids modal', () => {
    render()
    screen.getByText('mock AssignLiquidsModal')
  })
})
