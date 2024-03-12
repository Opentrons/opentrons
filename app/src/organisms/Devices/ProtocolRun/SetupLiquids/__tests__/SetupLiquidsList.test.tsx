import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { when } from 'vitest-when'
import { describe, it, beforeEach, vi, expect } from 'vitest'

import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'

import {
  nestedTextMatcher,
  renderWithProviders,
} from '../../../../../__testing-utils__'
import { i18n } from '../../../../../i18n'
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
import { useNotifyRunQuery } from '../../../../../resources/runs'

import type { Mock } from 'vitest'

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

vi.mock('../utils')
vi.mock('../../utils/getLocationInfoNames')
vi.mock('../LiquidsLabwareDetailsModal')
vi.mock('@opentrons/api-client')
vi.mock('../../../../../redux/analytics')
vi.mock('../../../../../resources/runs')

const render = (props: React.ComponentProps<typeof SetupLiquidsList>) => {
  return renderWithProviders(<SetupLiquidsList {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEvent: Mock

describe('SetupLiquidsList', () => {
  let props: React.ComponentProps<typeof SetupLiquidsList>
  beforeEach(() => {
    props = { runId: '123' }
    vi.mocked(getTotalVolumePerLiquidId).mockReturnValue(400)
    vi.mocked(getTotalVolumePerLiquidLabwarePair).mockReturnValue(200)
    vi.mocked(getLocationInfoNames).mockReturnValue({
      labwareName: 'mock labware name',
      slotName: '4',
    })
    mockTrackEvent = vi.fn()
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(parseLiquidsInLoadOrder).mockReturnValue(
      MOCK_LIQUIDS_IN_LOAD_ORDER
    )
    vi.mocked(parseLabwareInfoByLiquidId).mockReturnValue(
      MOCK_LABWARE_INFO_BY_LIQUID_ID as any
    )
    when(vi.mocked(LiquidsLabwareDetailsModal))
      .calledWith(
        expect.objectContaining({ labwareId: '123', liquidId: '0' }),
        // @ts-expect-error Potential Vitest issue. Seems this actually takes two args.
        expect.anything()
      )
      .thenReturn(<div>Mock liquids labware details modal</div>)
    vi.mocked(useNotifyRunQuery).mockReturnValue({} as any)
  })

  it('renders the total volume of the liquid, sample display name, and description', () => {
    render(props)
    screen.getAllByText(nestedTextMatcher('400 µL'))
    screen.getByText('mock liquid 1')
    screen.getByText('mock sample')
    screen.getByText('mock liquid 2')
    screen.getByText('another mock sample')
  })

  it('renders slot and labware info when clicking a liquid item', () => {
    render(props)
    const row = screen.getByText('mock liquid 1')
    fireEvent.click(row)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_EXPAND_LIQUID_SETUP_ROW,
      properties: {},
    })
    screen.getByText('Location')
    screen.getByText('Labware name')
    screen.getByText('Volume')
    screen.getAllByText(nestedTextMatcher('200 µL'))
    screen.getByText('4')
    screen.getByText('mock labware name')
  })

  it('opens the modal with correct props when a line item is clicked', () => {
    render(props)
    const row = screen.getByText('mock liquid 1')
    fireEvent.click(row)
    const subRow = screen.getByText('mock labware name')
    fireEvent.click(subRow)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_OPEN_LIQUID_LABWARE_DETAIL_MODAL,
      properties: {},
    })
    screen.getByText('Mock liquids labware details modal')
  })
})
