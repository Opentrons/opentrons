import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import {
  ConfirmDeleteEntityInUseModal,
  EditNickNameModal,
} from '../../../../components/organisms'
import { useKitchen } from '../../../../components/organisms/Kitchen/useKitchen'
import {
  deleteContainer,
  duplicateLabware,
} from '../../../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../../../labware-ingred/selectors'
import { getNextAvailableDeckSlot } from '../../../../labware-ingred/utils'
import { getSavedStepForms } from '../../../../step-forms/selectors'
import { getDeckSetupForActiveItem } from '../../../../top-selectors/labware-locations'
import { SlotOverflowMenu } from '../SlotOverflowMenu'
import { getIsLabwareOnSlotInUse } from '../utils'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const mockNavigate = vi.fn()

vi.mock('../utils')
vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../top-selectors/labware-locations')
vi.mock('../../../../labware-ingred/actions')
vi.mock('../../../../labware-ingred/selectors')
vi.mock('../../../../components/organisms')
vi.mock('../../../../file-data/selectors')
vi.mock('../../../../labware-ingred/utils')
vi.mock('../../../../components/organisms/Kitchen/useKitchen')
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: ComponentProps<typeof SlotOverflowMenu>) => {
  return renderWithProviders(<SlotOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const MOCK_STAGING_AREA_ID = 'MOCK_STAGING_AREA_ID'
const MOCK_MAKE_SNACKBAR = vi.fn()

describe('SlotOverflowMenu', () => {
  let props: ComponentProps<typeof SlotOverflowMenu>

  beforeEach(() => {
    props = {
      location: 'D3',
      setShowMenuList: vi.fn(),
      addEquipment: vi.fn(),
    }
    vi.mocked(getSavedStepForms).mockReturnValue({})
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      labware: {
        labId: {
          stack: ['labId', 'D3'],
          id: 'labId',
          labwareDefURI: 'mockUri',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'mockPythonName',
        },
        labId2: {
          stack: ['labId2', 'labId', 'D3'],
          id: 'labId2',
          labwareDefURI: 'mockUri',
          def: fixture96Plate as LabwareDefinition2,
          pythonName: 'mockPythonName',
        },
      },
      pipettes: {},
      modules: {
        mod: {
          model: 'heaterShakerModuleV1',
          type: 'heaterShakerModuleType',
          id: 'modId',
          slot: 'D3',
          moduleState: {} as any,
          pythonName: 'mockPythonName',
        },
      },
      additionalEquipmentOnDeck: {
        fixture: {
          name: 'stagingArea',
          id: MOCK_STAGING_AREA_ID,
          location: 'cutoutD3',
        },
      },
    })
    vi.mocked(EditNickNameModal).mockReturnValue(
      <div>mock EditNickNameModal</div>
    )
    vi.mocked(labwareIngredSelectors.getLiquidsByLabwareId).mockReturnValue({})
    vi.mocked(getNextAvailableDeckSlot).mockReturnValue('A1')
    vi.mocked(useKitchen).mockReturnValue({
      makeSnackbar: MOCK_MAKE_SNACKBAR,
      eatToast: vi.fn(),
      bakeToast: vi.fn(),
    })
    vi.mocked(ConfirmDeleteEntityInUseModal).mockReturnValue(
      <div>mock ConfirmDeleteEntityInUseModal</div>
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should renders all buttons as enabled and clicking on them calls ctas', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Edit labware' }))
    expect(props.addEquipment).toHaveBeenCalled()
    expect(props.setShowMenuList).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate labware' }))
    expect(vi.mocked(duplicateLabware)).toHaveBeenCalled()
    expect(props.setShowMenuList).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Clear labware' }))
    expect(vi.mocked(deleteContainer)).toHaveBeenCalledTimes(2)
    expect(props.setShowMenuList).toHaveBeenCalled()
  })

  it('renders snackbar if duplicate is clicked and the deck is full', () => {
    vi.mocked(getNextAvailableDeckSlot).mockReturnValue(null)
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate labware' }))
    expect(MOCK_MAKE_SNACKBAR).toHaveBeenCalled()
  })

  it('renders the ConfirmDeleteEntityInUseModal modal', () => {
    vi.mocked(getIsLabwareOnSlotInUse).mockReturnValue(true)
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Clear labware' }))
    screen.getByText('mock ConfirmDeleteEntityInUseModal')
  })
})
