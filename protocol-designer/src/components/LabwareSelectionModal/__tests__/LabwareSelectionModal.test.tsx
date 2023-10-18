import * as React from 'react'
import i18next from 'i18next'
import { renderWithProviders, nestedTextMatcher } from '@opentrons/components'
import {
  getIsLabwareAboveHeight,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
} from '@opentrons/shared-data'
import { getLabwareCompatibleWithAdapter } from '../../../utils/labwareModuleCompatibility'
import { Portal } from '../../portals/TopPortal'
import { LabwareSelectionModal } from '../LabwareSelectionModal'

jest.mock('../../../utils/labwareModuleCompatibility')
jest.mock('../../portals/TopPortal')
jest.mock('../../Hints/useBlockingHint')
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
const mockPortal = Portal as jest.MockedFunction<typeof Portal>
const mockGetLabwareCompatibleWithAdapter = getLabwareCompatibleWithAdapter as jest.MockedFunction<
  typeof getLabwareCompatibleWithAdapter
>
const render = (props: React.ComponentProps<typeof LabwareSelectionModal>) => {
  return renderWithProviders(<LabwareSelectionModal {...props} />, {
    i18nInstance: i18next,
  })[0]
}

describe('LabwareSelectionModal', () => {
  let props: React.ComponentProps<typeof LabwareSelectionModal>
  beforeEach(() => {
    props = {
      onClose: jest.fn(),
      onUploadLabware: jest.fn(),
      selectLabware: jest.fn(),
      customLabwareDefs: {},
      permittedTipracks: [],
      isNextToHeaterShaker: false,
      has96Channel: false,
    }
    mockPortal.mockReturnValue(<div>mock portal</div>)
    mockGetLabwareCompatibleWithAdapter.mockReturnValue([])
  })
  it('should NOT filter out labware above 57 mm when the slot is NOT next to a heater shaker', () => {
    props.isNextToHeaterShaker = false
    render(props)
    expect(mockGetIsLabwareAboveHeight).not.toHaveBeenCalled()
  })
  it('should filter out labware above 57 mm when the slot is next to a heater shaker', () => {
    props.isNextToHeaterShaker = true
    render(props)
    expect(mockGetIsLabwareAboveHeight).toHaveBeenCalledWith(
      expect.any(Object),
      MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
    )
  })
  it('should display only permitted tipracks if the 96-channel is attached', () => {
    const mockPermittedTipracks = ['mockPermittedTip', 'mockPermittedTip2']
    props.slot = 'A2'
    props.has96Channel = true
    props.adapterLoadName = 'mockLoadName'
    props.permittedTipracks = mockPermittedTipracks
    const { getByText, getAllByRole } = render(props)
    getByText(nestedTextMatcher('adapter compatible labware')).click()
    expect(getAllByRole('list', { name: '' })).toHaveLength(2)
  })
})
