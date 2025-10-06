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

    vi.fn(labwareIngredSelectors.getSelectedLabwareId).mockImplementation(
      () => 'mockLabwareId'
    )

    vi.fn(getInitialDeckSetup).mockImplementation(() => {
      return {
        labware: {
          mockLabwareId: {
            stack: ['mockLabwareId'],
            id: 'mockLabwareId',
            labwareDefURI: 'mockUri',
            def: fixture96Plate as LabwareDefinition2,
            pythonName: 'mockPythonName',
          },
        },
      }
    })
    props = {
      showLiquidOverflowMenu: vi.fn(),
      setDefineLiquidModal: vi.fn(),
    }
    vi.fn(useSelector).mockReturnValue({
      labwareInvariantProperties: {
        mockLabwareId: {
          stack: ['mockLabwareId'],
          id: 'mockLabwareId',
          labwareDefURI: 'mockUri',
          def: fixture96Plate as LabwareDefinition2,
        },
      },
      pipettes: {},
      modules: {},
      additionalEquipmentOnDeck: {},
    })
  })

  it('loads the modal', () => {
    render(props)

    const header = screen.getByTestId('header-prop')
    expect(header).toHaveTextContent('Assign Liquids')

    const primaryButton = screen.getByTestId('primary-button')
    expect(primaryButton).toHaveAttribute('data-button-text', 'Continue')

    const secondaryButton = screen.getByTestId('secondary-button')
    expect(secondaryButton).toHaveAttribute('data-text', 'Exit')
  })
})
