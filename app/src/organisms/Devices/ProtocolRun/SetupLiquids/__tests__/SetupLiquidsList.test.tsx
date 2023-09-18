import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { when } from 'jest-when'
import { i18n } from '../../../../../i18n'
import {
  renderWithProviders,
  partialComponentPropsMatcher,
  nestedTextMatcher,
} from '@opentrons/components'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'
import {
  useTrackEvent,
  ANALYTICS_EXPAND_LIQUID_SETUP_ROW,
  ANALYTICS_OPEN_LIQUID_LABWARE_DETAIL_MODAL,
} from '../../../../../redux/analytics'
import { getLocationInfoNames } from '../../utils/getLocationInfoNames'
import { SetupLiquidsList } from '../SetupLiquidsList'
import {
  getTotalVolumePerLiquidId,
  getTotalVolumePerLiquidLabwarePair,
} from '../utils'
import { LiquidsLabwareDetailsModal } from '../LiquidsLabwareDetailsModal'

const MOCK_LIQUIDS_IN_LOAD_ORDER = [
  {
    id: '0',
    displayName: 'mock liquid 1',
    description: 'mock sample',
    displayColor: '#ff4888',
  },
  {
    id: '1',
    displayName: 'mock liquid 2',
    description: 'another mock sample',
    displayColor: '#ff8999',
  },
]
const MOCK_LABWARE_INFO_BY_LIQUID_ID = {
  '0': [
    {
      labwareId: '123',
    },
  ],
  '1': [
    {
      labwareId: '234',
    },
  ],
}

jest.mock('../utils')
jest.mock('../../utils/getLocationInfoNames')
jest.mock('../LiquidsLabwareDetailsModal')
jest.mock('@opentrons/api-client')
jest.mock('../../../../../redux/analytics')

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockGetTotalVolumePerLiquidId = getTotalVolumePerLiquidId as jest.MockedFunction<
  typeof getTotalVolumePerLiquidId
>
const mockGetTotalVolumePerLiquidLabwarePair = getTotalVolumePerLiquidLabwarePair as jest.MockedFunction<
  typeof getTotalVolumePerLiquidLabwarePair
>
const mockGetLocationInfoNames = getLocationInfoNames as jest.MockedFunction<
  typeof getLocationInfoNames
>
const mockParseLiquidsInLoadOrder = parseLiquidsInLoadOrder as jest.MockedFunction<
  typeof parseLiquidsInLoadOrder
>
const mockParseLabwareInfoByLiquidId = parseLabwareInfoByLiquidId as jest.MockedFunction<
  typeof parseLabwareInfoByLiquidId
>
const mockLiquidsLabwareDetailsModal = LiquidsLabwareDetailsModal as jest.MockedFunction<
  typeof LiquidsLabwareDetailsModal
>

const render = (props: React.ComponentProps<typeof SetupLiquidsList>) => {
  return renderWithProviders(<SetupLiquidsList {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEvent: jest.Mock

describe('SetupLiquidsList', () => {
  let props: React.ComponentProps<typeof SetupLiquidsList>
  beforeEach(() => {
    props = { runId: '123' }
    mockGetTotalVolumePerLiquidId.mockReturnValue(400)
    mockGetTotalVolumePerLiquidLabwarePair.mockReturnValue(200)
    mockGetLocationInfoNames.mockReturnValue({
      labwareName: 'mock labware name',
      slotName: '4',
    })
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockParseLiquidsInLoadOrder.mockReturnValue(MOCK_LIQUIDS_IN_LOAD_ORDER)
    mockParseLabwareInfoByLiquidId.mockReturnValue(
      MOCK_LABWARE_INFO_BY_LIQUID_ID as any
    )
    when(mockLiquidsLabwareDetailsModal)
      .calledWith(
        partialComponentPropsMatcher({ labwareId: '123', liquidId: '0' })
      )
      .mockReturnValue(<div>Mock liquids labwaqre details modal</div>)
  })

  it('renders the total volume of the liquid, sample display name, and description', () => {
    const [{ getByText, getAllByText }] = render(props)
    getAllByText(nestedTextMatcher('400 µL'))
    getByText('mock liquid 1')
    getByText('mock sample')
    getByText('mock liquid 2')
    getByText('another mock sample')
  })

  it('renders slot and labware info when clicking a liquid item', () => {
    const [{ getByText, getAllByText }] = render(props)
    const row = getByText('mock liquid 1')
    fireEvent.click(row)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_EXPAND_LIQUID_SETUP_ROW,
      properties: {},
    })
    getByText('Location')
    getByText('Labware name')
    getByText('Volume')
    getAllByText(nestedTextMatcher('200 µL'))
    getByText('4')
    getByText('mock labware name')
  })

  it('opens the modal with correct props when a line item is clicked', () => {
    const [{ getByText }] = render(props)
    const row = getByText('mock liquid 1')
    fireEvent.click(row)
    const subRow = getByText('mock labware name')
    fireEvent.click(subRow)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_OPEN_LIQUID_LABWARE_DETAIL_MODAL,
      properties: {},
    })
    getByText('Mock liquids labwaqre details modal')
  })
})
