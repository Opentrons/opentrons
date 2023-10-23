import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { getLocationInfoNames } from '../../Devices/ProtocolRun/utils/getLocationInfoNames'
import { getTotalVolumePerLiquidId } from '../../Devices/ProtocolRun/SetupLiquids/utils'
import { LiquidDetails } from '../LiquidDetails'
import { LiquidsLabwareDetailsModal } from '../../Devices/ProtocolRun/SetupLiquids/LiquidsLabwareDetailsModal'
import {
  MOCK_LABWARE_INFO_BY_LIQUID_ID,
  MOCK_PROTOCOL_ANALYSIS,
} from '../fixtures'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

jest.mock('../../Devices/ProtocolRun/SetupLiquids/utils')
jest.mock('../../Devices/ProtocolRun/utils/getLocationInfoNames')
jest.mock('../../Devices/ProtocolRun/SetupLiquids/LiquidsLabwareDetailsModal')

const mockGetLocationInfoNames = getLocationInfoNames as jest.MockedFunction<
  typeof getLocationInfoNames
>
const mockgetTotalVolumePerLiquidId = getTotalVolumePerLiquidId as jest.MockedFunction<
  typeof getTotalVolumePerLiquidId
>
const mockLiquidsLabwareDetailsModal = LiquidsLabwareDetailsModal as jest.MockedFunction<
  typeof LiquidsLabwareDetailsModal
>
const render = (props: React.ComponentProps<typeof LiquidDetails>) => {
  return renderWithProviders(<LiquidDetails {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LiquidDetails', () => {
  let props: React.ComponentProps<typeof LiquidDetails>
  beforeEach(() => {
    props = {
      commands: (MOCK_PROTOCOL_ANALYSIS as CompletedProtocolAnalysis).commands,
      labwareByLiquidId: MOCK_LABWARE_INFO_BY_LIQUID_ID,
      runId: RUN_ID_1,
      liquid: {
        id: '0',
        displayName: 'mock liquid 1',
        description: 'mock sample',
        displayColor: '#ff4888',
      },
    }
    mockgetTotalVolumePerLiquidId.mockReturnValue(50)
    mockGetLocationInfoNames.mockReturnValue({
      slotName: '4',
      labwareName: 'mock labware name',
    })
    mockLiquidsLabwareDetailsModal.mockReturnValue(<div>mock modal</div>)
  })

  it('renders the total volume of the liquid, sample display name, clicking on arrow renders the modal', () => {
    const [{ getByText, getByLabelText }] = render(props)
    getByText('4')
    getByText('mock labware name')
    getByText('Location')
    getByText('Labware name')
    getByText('Volume')
    getByText('50 µL')
    getByLabelText('LiquidDetails_0').click()
    getByText('mock modal')
  })
})
