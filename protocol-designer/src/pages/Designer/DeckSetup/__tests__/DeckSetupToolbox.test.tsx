import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import {
  ABSORBANCE_READER_V1,
  fixture96Plate,
  fixtureTiprackAdapter,
  FLEX_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { SelectLabwareModal } from '/protocol-designer/components/organisms'
import { useKitchen } from '/protocol-designer/components/organisms/Kitchen/useKitchen'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import {
  deleteContainer,
  openIngredientSelector,
} from '/protocol-designer/labware-ingred/actions'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import {
  getAdditionalEquipment,
  getDeckConfiguration,
  getLabwareEntities,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'
import { getDismissedHints } from '/protocol-designer/tutorial/selectors'

import { DeckSetupToolbox } from '../DeckSetupToolbox'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const mockNavigate = vi.fn()
const mockMakeSnackbar = vi.fn()

vi.mock('/protocol-designer/feature-flags/selectors')
vi.mock('/protocol-designer/file-data/selectors')
vi.mock('/protocol-designer/top-selectors/labware-locations')
vi.mock('/protocol-designer/labware-ingred/actions')
vi.mock('/protocol-designer/labware-ingred/selectors')
vi.mock('/protocol-designer/tutorial/selectors')
vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/top-selectors/well-contents')
vi.mock('/protocol-designer/components/organisms/Kitchen/useKitchen')
vi.mock('/protocol-designer/components/organisms/SelectLabwareModal')
vi.mock('/protocol-designer/ui/labware/selectors')
const render = (props: ComponentProps<typeof DeckSetupToolbox>) => {
  return renderWithProviders(<DeckSetupToolbox {...props} />, {
    i18nInstance: i18n,
  })[0]
}
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('DeckSetupToolbox', () => {
  let props: ComponentProps<typeof DeckSetupToolbox>

  beforeEach(() => {
    props = {
      onCloseClick: vi.fn(),
    }
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedAdapterDefURI: null,
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedFixture: null,
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    vi.mocked(getLabwareEntities).mockReturnValue({})
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      labware: {},
      modules: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
    })
    vi.mocked(SelectLabwareModal).mockReturnValue(
      <div>mock SelectLabwareModal</div>
    )
    vi.mocked(getSavedStepForms).mockReturnValue({})
    vi.mocked(getDismissedHints).mockReturnValue([])
    vi.mocked(getAdditionalEquipment).mockReturnValue({})
    vi.mocked(useKitchen).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      bakeToast: vi.fn(),
      eatToast: vi.fn(),
    })
    vi.mocked(
      wellContentsSelectors.getAllWellContentsForActiveItem
    ).mockReturnValue(null)
    vi.mocked(getDeckConfiguration).mockReturnValue({
      deckConfig: [],
    })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should render empty labware and add labware CTA opens modal ', () => {
    render(props)
    screen.getByText('Edit labware')
    screen.getByText('Add labware')
    screen.getByText('No labware added')
    screen.getByText('Select labware to add to slot')
    fireEvent.click(screen.getByText('Add labware'))
    screen.getByText('mock SelectLabwareModal')
  })
  it('renders correct copy for adding a labware onto a plate reader', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedAdapterDefURI: null,
      selectedTopLabware: { labwareDefURI: null, amount: 1 },
      selectedLidLabware: null,
      selectedFixture: null,
      selectedModuleModel: ABSORBANCE_READER_V1,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    render(props)
    screen.getByText('Can’t add labware')
    screen.getByText(
      'The plate reader must start empty so it can be initialized.'
    )
  })
  it('should clear the slot from all items when the clear cta is called', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedAdapterDefURI: 'mockUri',
      selectedTopLabware: { labwareDefURI: 'mockUri', amount: 1 },
      selectedLidLabware: null,
      selectedFixture: null,
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })

    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      labware: {
        labId: {
          stack: ['labId', 'D3'],
          id: 'labId',
          labwareDefURI: 'mockUri',
          def: fixtureTiprackAdapter as LabwareDefinition2,
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
        fixture: { name: 'stagingArea', id: 'mockId', location: 'cutoutD3' },
      },
    })
    render(props)
    screen.getByText('Edit liquid')
    screen.getByText('Bottom of slot')
    screen.getByText('Top of slot')
    fireEvent.click(screen.getByText('Clear'))
    expect(vi.mocked(deleteContainer)).toHaveBeenCalledTimes(2)
    //  add a liquid
    fireEvent.click(screen.getByText('Edit liquid'))
    expect(mockNavigate).toHaveBeenCalled()
    expect(vi.mocked(openIngredientSelector)).toHaveBeenCalled()
    // replace labware when there is no space
    fireEvent.click(screen.getByText('Replace labware'))
    screen.getByText('mock SelectLabwareModal')
    // click done
    fireEvent.click(screen.getByText('Done'))
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
