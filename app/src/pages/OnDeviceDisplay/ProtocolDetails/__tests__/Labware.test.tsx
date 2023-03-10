import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useRequiredProtocolLabware } from '../../../Protocols/hooks'
import { Labware } from '../Labware'

import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'

jest.mock('../../../Protocols/hooks')

const mockUseRequiredProtocolLabware = useRequiredProtocolLabware as jest.MockedFunction<
  typeof useRequiredProtocolLabware
>

const MOCK_PROTOCOL_ID = 'mock_protocol_id'

const render = (props: React.ComponentProps<typeof Labware>) => {
  return renderWithProviders(<Labware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Labware', () => {
  let props: React.ComponentProps<typeof Labware>
  beforeEach(() => {
    props = {
      protocolId: MOCK_PROTOCOL_ID,
    }
    when(mockUseRequiredProtocolLabware)
      .calledWith(MOCK_PROTOCOL_ID)
      .mockReturnValue([
        {
          definition: fixture_tiprack_10_ul,
          initialLocation: { slotName: '1' },
        },
        {
          definition: fixture_tiprack_300_ul,
          initialLocation: { slotName: '3' },
        },
        {
          definition: fixture_96_plate,
          initialLocation: { slotName: '5' },
        },
      ])
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render column headers that indicate where the labware is, what is called, and how many are required', () => {
    const { getByRole } = render(props)[0]
    getByRole('columnheader', { name: 'Slot' })
    getByRole('columnheader', { name: 'Labware Name' })
    getByRole('columnheader', { name: 'Quantity' })
  })
  it('should render the correct location, name, and connected status in each table row', () => {
    const { getByRole } = render(props)[0]
    getByRole('row', { name: 'Slot 1 Opentrons GEB 10uL Tiprack 1' })
    getByRole('row', { name: 'Slot 3 300ul Tiprack FIXTURE 1' })
    getByRole('row', { name: 'Slot 5 ANSI 96 Standard Microplate 1' })
  })
})
