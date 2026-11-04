import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'
import {
  getFullStackFromLabwares,
  getLiquidIdsOnLabwareStack,
} from '@opentrons/step-generation'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'

import { i18n } from '../../../../assets/localization'
import { openIngredientSelector } from '../../../../labware-ingred/actions'
import { getDeckSetupForActiveItem } from '../../../../top-selectors/labware-locations'
import * as wellContentsSelectors from '../../../../top-selectors/well-contents'
import { EditLabwareQuantityModal } from '../../EditLabwareQuantityModal'
import { LabwareCardOverflowMenu } from '../../LabwareCardOverflowMenu'
import { LabwareCard } from '../index'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const mockNavigate = vi.fn()

vi.mock('../../../../labware-ingred/actions')
vi.mock('../../LabwareCardOverflowMenu')
vi.mock('../../../../ui/labware/selectors')
vi.mock('../../../../top-selectors/well-contents')
vi.mock('@opentrons/step-generation')
vi.mock('../../../../feature-flags/selectors')
vi.mock('../../../../top-selectors/labware-locations')
vi.mock('../../EditLabwareQuantityModal')
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
      lidId: 'lidId',
      quantity: 1,
      location: 'A1',
    }
    vi.mocked(getFullStackFromLabwares).mockReturnValue([
      'lidId',
      'labwreId',
      'A1',
    ])
    vi.mocked(EditLabwareQuantityModal).mockReturnValue(
      <div>mock EditLabwareQuantityModal</div>
    )
    vi.mocked(LabwareCardOverflowMenu).mockReturnValue(
      <div>mock LabwareCardOverflowMenu</div>
    )
    vi.mocked(
      wellContentsSelectors.getAllWellContentsForActiveItem
    ).mockReturnValue(null)
    vi.mocked(getLiquidIdsOnLabwareStack).mockReturnValue([])
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      modules: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {
        labwareId: {
          id: 'labwareId',
          labwareDefURI: 'mockuri',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'mockPythonName',
          stack: ['labwareId', 'A1'],
        },
        lidId: {
          id: 'lidId',
          labwareDefURI: 'mockuri',
          def: {
            ...fixture96Plate,
            metadata: { displayName: 'mock lid' },
          } as any as LabwareDefinition2,
          pythonName: 'mockPythonName',
          stack: ['lidId', 'labwareId', 'A1'],
        },
      },
    })
  })

  it('renders a labware card with the liquids button and overflow menu', () => {
    render(props)
    screen.getByText('ANSI 96 Standard Microplate')
    screen.getByText('No liquids added')
    screen.getByText('with mock lid')
    fireEvent.click(screen.getByText('Edit liquid'))
    expect(mockNavigate).toHaveBeenCalledWith('/liquids')
    expect(vi.mocked(openIngredientSelector)).toHaveBeenCalled()
    fireEvent.click(
      screen.getByLabelText('ANSI 96 Standard Microplate options')
    )
    screen.getByText('mock LabwareCardOverflowMenu')
  })

  it('renders a labware card with 2 liquids added', () => {
    vi.mocked(getLiquidIdsOnLabwareStack).mockReturnValue(['0', '1'])
    render(props)
    screen.getByText('Multiple liquid layouts')
  })

  it('renders a labware card with 1 liquid added', () => {
    vi.mocked(getLiquidIdsOnLabwareStack).mockReturnValue(['0'])
    render(props)
    screen.getByText('1 liquid')
  })

  it('renders a labware card with edit quantity copy and pressing button renders modal', () => {
    props.labware = {
      ...props.labware,
      def: {
        ...fixture96Plate,
        stackLimit: 4,
        allowedRoles: ['lid'],
      } as LabwareDefinition2,
    }
    render(props)
    fireEvent.click(screen.getByText('Edit quantity'))
    screen.getByText('mock EditLabwareQuantityModal')
  })
})
