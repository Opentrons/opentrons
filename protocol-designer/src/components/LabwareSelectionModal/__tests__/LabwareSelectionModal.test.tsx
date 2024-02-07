import * as React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, cleanup } from '@testing-library/react'
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
import type * as SharedData from '@opentrons/shared-data'

vi.mock('../../../utils/labwareModuleCompatibility')
vi.mock('../../../step-forms/selectors')
vi.mock('../../../labware-defs/selectors')
vi.mock('../../Hints/useBlockingHint')
vi.mock('../../../utils')
vi.mock('../../../labware-ingred/selectors')
vi.mock('@opentrons/shared-data', async (importOriginal) => {
  const actual = await importOriginal<typeof SharedData>()
  return {
    ...actual,
    getIsLabwareAboveHeight: vi.fn(),
  }
})

const render = () => {
  return renderWithProviders(<LabwareSelectionModal />, {
    i18nInstance: i18n,
  })[0]
}

const mockTipUri = 'fixture/fixture_tiprack_1000_ul/1'
const mockPermittedTipracks = [mockTipUri]

describe('LabwareSelectionModal', () => {
  beforeEach(() => {
    vi.mocked(getLabwareCompatibleWithAdapter).mockReturnValue([])
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      labware: {},
      modules: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
    })
    vi.mocked(labwareIngredSelectors.selectedAddLabwareSlot).mockReturnValue('2')
    vi.mocked(getHas96Channel).mockReturnValue(false)
    vi.mocked(getPermittedTipracks).mockReturnValue(mockPermittedTipracks)
    vi.mocked(getPipetteEntities).mockReturnValue({
      mockPip: {
        tiprackLabwareDef: {} as any,
        spec: {} as any,
        name: 'p1000_single',
        id: 'mockId',
        tiprackDefURI: mockTipUri,
      },
    })
    vi.mocked(getCustomLabwareDefsByURI).mockReturnValue({})
  })
  afterEach(() => {
    cleanup()
  })
  it('should NOT filter out labware above 57 mm when the slot is NOT next to a heater shaker', () => {
    render()
    expect(vi.mocked(getIsLabwareAboveHeight)).not.toHaveBeenCalled()
  })
  it('should filter out labware above 57 mm when the slot is next to a heater shaker', () => {
    vi.mocked(getInitialDeckSetup).mockReturnValue({
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
    expect(vi.mocked(getIsLabwareAboveHeight)).toHaveBeenCalledWith(
      expect.any(Object),
      MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
    )
  })
  it.only('should display only permitted tipracks if the 96-channel is attached', () => {
    vi.mocked(getHas96Channel).mockReturnValue(true)
    vi.mocked(labwareIngredSelectors.selectedAddLabwareSlot).mockReturnValue('adapter')
    vi.mocked(getInitialDeckSetup).mockReturnValue({
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
