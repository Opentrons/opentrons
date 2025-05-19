import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { openIngredientSelector } from '../../../../labware-ingred/actions'
import * as wellContentsSelectors from '../../../../top-selectors/well-contents'
import { getLabwareNicknamesById } from '../../../../ui/labware/selectors'
import { LabwareCardOverflowMenu } from '../../LabwareCardOverflowMenu'
import { getLiquidIdsOnLabware } from '../../utils'
import { LabwareCard } from '../index'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const mockNavigate = vi.fn()

vi.mock('../../../../labware-ingred/actions')
vi.mock('../../LabwareCardOverflowMenu')
vi.mock('../../../../ui/labware/selectors')
vi.mock('../../../../top-selectors/well-contents')
vi.mock('../../utils')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: ComponentProps<typeof LabwareCard>) => {
  return renderWithProviders(<LabwareCard {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LabwareCard', () => {
  let props: ComponentProps<typeof LabwareCard>

  beforeEach(() => {
    props = {
      labware: {
        id: 'labwareId',
        pythonName: 'mockPythonName',
        stack: ['labwareId', 'A1'],
        labwareDefURI: 'mockuri',
        def: fixture96Plate as LabwareDefinition2,
      },
      lidDisplayName: 'mock lid',
    }
    vi.mocked(LabwareCardOverflowMenu).mockReturnValue(
      <div>mock LabwareCardOverflowMenu</div>
    )
    vi.mocked(getLabwareNicknamesById).mockReturnValue({
      labwareId: 'mock NickName',
    })
    vi.mocked(
      wellContentsSelectors.getAllWellContentsForActiveItem
    ).mockReturnValue(null)
    vi.mocked(getLiquidIdsOnLabware).mockReturnValue([])
  })

  it('renders a labware card with the liquids button and overflow menu', () => {
    render(props)
    screen.getByText('mock NickName')
    screen.getByText('ANSI 96 Standard Microplate')
    screen.getByText('mock lid')
    screen.getByText('No liquids added')
    fireEvent.click(screen.getByText('Add liquid'))
    expect(mockNavigate).toHaveBeenCalledWith('/liquids')
    expect(vi.mocked(openIngredientSelector)).toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('LabwareCard_overflowBtn'))
    screen.getByText('mock LabwareCardOverflowMenu')
  })
  it('renders a labware card with 2 liquids added', () => {
    vi.mocked(getLiquidIdsOnLabware).mockReturnValue(['0', '1'])
    render(props)
    screen.getByText('2 liquids')
  })
  it('renders a labware card with 1 liquid added', () => {
    vi.mocked(getLiquidIdsOnLabware).mockReturnValue(['0'])
    render(props)
    screen.getByText('1 liquid')
  })
})
