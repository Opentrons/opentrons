import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'

import { fixture96Plate, FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { useKitchen } from '../../../../components/organisms/Kitchen/hooks'
import { getRobotType } from '../../../../file-data/selectors'
import { deleteContainer } from '../../../../labware-ingred/actions'
import { selectors } from '../../../../labware-ingred/selectors'
import {
  getAdditionalEquipment,
  getSavedStepForms,
} from '../../../../step-forms/selectors'
import { getDeckSetupForActiveItem } from '../../../../top-selectors/labware-locations'
import { getDismissedHints } from '../../../../tutorial/selectors'
import { DeckSetupToolbox } from '../DeckSetupToolbox'
import { LabwareTools } from '../LabwareTools'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../LabwareTools')
vi.mock('../../../../feature-flags/selectors')
vi.mock('../../../../file-data/selectors')
vi.mock('../../../../top-selectors/labware-locations')
vi.mock('../../../../labware-ingred/actions')
vi.mock('../../../../labware-ingred/selectors')
vi.mock('../../../../tutorial/selectors')
vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../components/organisms/Kitchen/hooks')
const render = (props: ComponentProps<typeof DeckSetupToolbox>) => {
  return renderWithProviders(<DeckSetupToolbox {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockMakeSnackbar = vi.fn()

describe('DeckSetupToolbox', () => {
  let props: ComponentProps<typeof DeckSetupToolbox>

  beforeEach(() => {
    props = {
      onCloseClick: vi.fn(),
      setHoveredLabware: vi.fn(),
    }
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: null,
      selectedNestedLabwareDefUri: null,
      selectedFixture: null,
      selectedModuleModel: null,
      selectedSlot: { slot: 'D3', cutout: 'cutoutD3' },
    })
    vi.mocked(LabwareTools).mockReturnValue(<div>mock labware tools</div>)
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getDeckSetupForActiveItem).mockReturnValue({
      labware: {},
      modules: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
    })
    vi.mocked(getSavedStepForms).mockReturnValue({})
    vi.mocked(getDismissedHints).mockReturnValue([])
    vi.mocked(getAdditionalEquipment).mockReturnValue({})
    vi.mocked(useKitchen).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      bakeToast: vi.fn(),
      eatToast: vi.fn(),
    })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should render the labware', () => {
    render(props)
    screen.getByText('Customize slot')
    screen.getByText('mock labware tools')
  })
  it('should clear the slot from all items when the clear cta is called', () => {
    vi.mocked(selectors.getZoomedInSlotInfo).mockReturnValue({
      selectedLabwareDefUri: 'mockUri',
      selectedNestedLabwareDefUri: 'mockUri',
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
        fixture: { name: 'stagingArea', id: 'mockId', location: 'cutoutD3' },
      },
    })
    render(props)
    fireEvent.click(screen.getByText('Clear'))
    expect(vi.mocked(deleteContainer)).toHaveBeenCalledTimes(2)
  })
})
