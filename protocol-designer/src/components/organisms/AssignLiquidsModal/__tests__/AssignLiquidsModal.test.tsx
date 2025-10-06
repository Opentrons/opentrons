import { useSelector } from 'react-redux'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate, LabwareDefinition2 } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { selectors as labwareIngredSelectors } from '/protocol-designer/labware-ingred/selectors'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { AssignLiquidsModal } from '..'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

const mockNavigate = vi.fn()

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useSelector: vi.fn(),
  }
})
vi.mock('/protocol-designer/labware-ingred/selectors', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    getSelectedLabwareId: vi.fn(),
  }
})
vi.mock('/protocol-designer/step-forms/selectors', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    getInitialDeckSetup: vi.fn(),
  }
})
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
// vi.mock('/protocol-designer/top-selectors/labware-locations', async (importOriginal) => {
//     const actual = await importOriginal()
//     return {
//       ...actual,
//       getDeckSetupForActiveItem: vi.fn()
//     }
//   })

const render = (props: ComponentProps<typeof AssignLiquidsModal>) => {
  return renderWithProviders(<AssignLiquidsModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AssignLiquidsModal', () => {
  let props: ComponentProps<typeof AssignLiquidsModal>
  let mockShowLiquidOverflowMenu: Mock
  let mockSetDefineLiquidModal: Mock

  beforeEach(() => {
    mockShowLiquidOverflowMenu = vi.fn()
    mockSetDefineLiquidModal = vi.fn()

    props = {
      showLiquidOverflowMenu: vi.fn(),
      setDefineLiquidModal: vi.fn(),
      data: {
        nickNames: {},
        labwareId: 'mockLabwareId',
        selectedWells: {},
        labware: {
          mockLabwareId: {
            stack: ['mockLabwareId'],
            id: 'mockLabwareId',
            labwareDefURI: 'mockUri',
            def: fixture96Plate as LabwareDefinition2,
            pythonName: 'mockPythonName',
          },
        },
        labwareEntities: {
          mockLabwareId: { def: fixture96Plate as LabwareDefinition2 },
        },
        allWellContents: {},
        liquidNamesById: {},
        liquidDisplayColors: {},
        liquids: {},
        selectedWellGroups: {},
        liquidLocations: {},
        commonSelectedLiquidId: null,
        commonSelectedVolume: null,
        selectedWellsMaxVolume: null,
        liquidSelectionOptions: [],
        allWellContentsForActiveItem: {},
      },
    }
  })

  it('loads the modal without selectable labware', () => {
    render(props)

    expect(screen.getByText('Top of stack')).not.toBeInTheDocument()
    screen.getByText('mockLabwareId')

    screen.getByText('Click and drag to select wells')

    const primaryButton = screen.getByTestId('primary-button')
    expect(primaryButton).toHaveAttribute('data-button-text', 'Continue')

    const secondaryButton = screen.getByTestId('secondary-button')
    expect(secondaryButton).toHaveAttribute('data-text', 'Exit')
  })

  it('loads the modal with selectable labware', () => {
    render(props)

    screen.getByText('Top of stack')
    screen.getByText('mockLabwareId')
  })
})
