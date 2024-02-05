import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders, nestedTextMatcher } from '../../../__testing-utils__'
import {
  getIsLabwareAboveHeight,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
} from '@opentrons/shared-data'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import {
  ADAPTER_96_CHANNEL,
  getLabwareCompatibleWithAdapter,
} from '../../../utils/labwareModuleCompatibility'
import { i18n } from '../../../localization'
import { LabwareSelectionModal } from '../LabwareSelectionModal'
import {
  getInitialDeckSetup,
  getPermittedTipracks,
  getPipetteEntities,
} from '../../../step-forms/selectors'
import { getHas96Channel } from '../../../utils'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'

jest.mock('../../../utils/labwareModuleCompatibility')
jest.mock('../../../step-forms/selectors')
jest.mock('../../../labware-defs/selectors')
jest.mock('../../Hints/useBlockingHint')
jest.mock('../../../utils')
jest.mock('../../../labware-ingred/selectors')
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getIsLabwareAboveHeight: jest.fn(),
  }
})

const mockGetIsLabwareAboveHeight = getIsLabwareAboveHeight as jest.MockedFunction<
  typeof getIsLabwareAboveHeight
>
const mockGetLabwareCompatibleWithAdapter = getLabwareCompatibleWithAdapter as jest.MockedFunction<
  typeof getLabwareCompatibleWithAdapter
>
const mockGetInitialDeckSetup = getInitialDeckSetup as jest.MockedFunction<
  typeof getInitialDeckSetup
>
const mockSlot = labwareIngredSelectors.selectedAddLabwareSlot as jest.MockedFunction<
  typeof labwareIngredSelectors.selectedAddLabwareSlot
>
const mockGetHas96Channel = getHas96Channel as jest.MockedFunction<
  typeof getHas96Channel
>
const mockGetPipetteEntities = getPipetteEntities as jest.MockedFunction<
  typeof getPipetteEntities
>
const mockGetPermittedTipracks = getPermittedTipracks as jest.MockedFunction<
  typeof getPermittedTipracks
>
const mockGetCustomLabwareDefsByURI = getCustomLabwareDefsByURI as jest.MockedFunction<
  typeof getCustomLabwareDefsByURI
>
const render = () => {
  return renderWithProviders(<LabwareSelectionModal />, {
    i18nInstance: i18n,
  })[0]
}

const mockTipUri = 'fixture/fixture_tiprack_1000_ul/1'
const mockPermittedTipracks = [mockTipUri]

describe('LabwareSelectionModal', () => {
  beforeEach(() => {
    mockGetLabwareCompatibleWithAdapter.mockReturnValue([])
    mockGetInitialDeckSetup.mockReturnValue({
      labware: {},
      modules: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
    })
    mockSlot.mockReturnValue('2')
    mockGetHas96Channel.mockReturnValue(false)
    mockGetPermittedTipracks.mockReturnValue(mockPermittedTipracks)
    mockGetPipetteEntities.mockReturnValue({
      mockPip: {
        tiprackLabwareDef: {} as any,
        spec: {} as any,
        name: 'p1000_single',
        id: 'mockId',
        tiprackDefURI: mockTipUri,
      },
    })
    mockGetCustomLabwareDefsByURI.mockReturnValue({})
  })
  it('should NOT filter out labware above 57 mm when the slot is NOT next to a heater shaker', () => {
    render()
    expect(mockGetIsLabwareAboveHeight).not.toHaveBeenCalled()
  })
  it('should filter out labware above 57 mm when the slot is next to a heater shaker', () => {
    mockGetInitialDeckSetup.mockReturnValue({
      labware: {},
      modules: {
        heaterShaker: {
          id: 'mockId',
          type: 'heaterShakerModuleType',
          model: 'heaterShakerModuleV1',
          moduleState: {} as any,
          slot: '1',
        } as any,
      },
      pipettes: {},
      additionalEquipmentOnDeck: {},
    })
    render()
    expect(mockGetIsLabwareAboveHeight).toHaveBeenCalledWith(
      expect.any(Object),
      MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
    )
  })
  it('should display only permitted tipracks if the 96-channel is attached', () => {
    mockGetHas96Channel.mockReturnValue(true)
    mockSlot.mockReturnValue('adapter')
    mockGetInitialDeckSetup.mockReturnValue({
      labware: {
        adapter: {
          id: 'adapter',
          labwareDefURI: `opentrons/${ADAPTER_96_CHANNEL}/1`,
          slot: 'A2',
          def: { parameters: { loadName: ADAPTER_96_CHANNEL } } as any,
        },
      },
      modules: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
    })
    render()
    fireEvent.click(
      screen.getByText(nestedTextMatcher('adapter compatible labware'))
    )
    screen.getByText('Opentrons GEB 1000uL Tiprack')
  })
})
