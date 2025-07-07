import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'
import { getLiquidIdsOnLabware } from '@opentrons/step-generation'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { getEnableStacking } from '../../../../feature-flags/selectors'
import { openIngredientSelector } from '../../../../labware-ingred/actions'
import { getDeckSetupForActiveItem } from '../../../../top-selectors/labware-locations'
import * as wellContentsSelectors from '../../../../top-selectors/well-contents'
import { getLabwareNicknamesById } from '../../../../ui/labware/selectors'
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
    }
    vi.mocked(EditLabwareQuantityModal).mockReturnValue(
      <div>mock EditLabwareQuantityModal</div>
    )
    vi.mocked(LabwareCardOverflowMenu).mockReturnValue(
      <div>mock LabwareCardOverflowMenu</div>
    )
    vi.mocked(getLabwareNicknamesById).mockReturnValue({
      labwareId: 'mock NickName',
    })
    vi.mocked(
      wellContentsSelectors.getAllWellContentsForActiveItem
    ).mockReturnValue(null)
    vi.mocked(getEnableStacking).mockReturnValue(true)
    vi.mocked(getLiquidIdsOnLabware).mockReturnValue([])
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
          def: ({
            ...fixture96Plate,
            metadata: { displayName: 'mock lid' },
          } as any) as LabwareDefinition2,
          pythonName: 'mockPythonName',
          stack: ['labwareId', 'A1'],
        },
      },
    })
  })

  it('renders a labware card with the liquids button and overflow menu', () => {
    render(props)
    screen.getByText('mock NickName')
    screen.getByText('ANSI 96 Standard Microplate')
    screen.getByText('No liquids added')
    screen.getByText('with mock lid')
    fireEvent.click(screen.getByText('Edit liquid'))
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
  it('renders a labware card with the quantity tag', () => {
    props.quantity = 2
    props.labware = {
      ...props.labware,
      def: { ...fixture96Plate, stackLimit: 4 } as LabwareDefinition2,
    }
    render(props)
    screen.getByText('mock NickName')
    screen.getByText('ANSI 96 Standard Microplate')
    screen.getByText('Quantity: 2')
    screen.getByText('Edit liquid and quantity')
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
