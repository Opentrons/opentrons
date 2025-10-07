import { useSelector } from 'react-redux'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate, LabwareDefinition2 } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { AssignLiquidsModal } from '..'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'
import { NavigateFunction } from 'react-router-dom'
import { LiquidToolboxContainer } from '../LiquidToolbox'

const mockNavigate = vi.fn()
const mockDispatch = vi.fn()
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useSelector: vi.fn(),
    useDispatch: () => mockDispatch,
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
// Mock the MyButton component
vi.mock('../LiquidToolbox', () => ({
    LiquidToolboxContainer: vi.fn(() => <div>mock LiquidToolbox</div>),
  }));
  
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

    expect(screen.queryByText('Top of stack')).not.toBeInTheDocument()
    screen.getByText('mockLabwareId')

    screen.getByText('Click and drag to select wells')
  })

  it('loads the modal with selectable labware', () => {
    props.data.labware['mockLabwareId'].stack = ['mockLabwareId', 'labware2']
    props.data.labware['labware2'] = {
      def: fixture96Plate as LabwareDefinition2,
    }
    render(props)

    screen.getByText('Top of stack')
    expect(screen.getAllByText('ANSI 96 Standard Microplate').length).toBe(2)
    const firstButton = screen.getByTestId('LabwareButton-1')
    expect(firstButton).toHaveClass('_button_active_386e4e')

    const scondButton = screen.getByTestId('LabwareButton-0')
    fireEvent.click(scondButton)
    expect(scondButton).toHaveClass('_button_active_386e4e')
    // expect(mockDispatch).toHaveBeenCalledWith({
    //   type: 'SELECT_WELLS',
    //   payload: {
    //     A1: null,
    //     A2: null,
    //     A3: null,
    //     A4: null,
    //     A5: null,
    //   },
    // })
  })
})
