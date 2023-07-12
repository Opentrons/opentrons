import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { ProtocolLiquidsDetails } from '../ProtocolLiquidsDetails'
import { LiquidsListItemDetails } from '../../Devices/ProtocolRun/SetupLiquids/SetupLiquidsList'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'

jest.mock('../../Devices/ProtocolRun/SetupLiquids/SetupLiquidsList')
jest.mock('@opentrons/api-client')

const mockLiquidsListItemDetails = LiquidsListItemDetails as jest.MockedFunction<
  typeof LiquidsListItemDetails
>

const mockParseLiquidsInLoadOrder = parseLiquidsInLoadOrder as jest.MockedFunction<
  typeof parseLiquidsInLoadOrder
>

const mockParseLabwareInfoByLiquidId = parseLabwareInfoByLiquidId as jest.MockedFunction<
  typeof parseLabwareInfoByLiquidId
>

const render = (props: React.ComponentProps<typeof ProtocolLiquidsDetails>) => {
  return renderWithProviders(<ProtocolLiquidsDetails {...props} />)
}

describe('ProtocolLiquidsDetails', () => {
  let props: React.ComponentProps<typeof ProtocolLiquidsDetails>
  beforeEach(() => {
    mockLiquidsListItemDetails.mockReturnValue(
      <div>mock liquids list item</div>
    )
    mockParseLiquidsInLoadOrder.mockReturnValue([
      {
        id: '1',
        displayName: 'mock liquid',
        description: '',
        displayColor: '#FFFFFF',
      },
    ])
    mockParseLabwareInfoByLiquidId.mockReturnValue({
      '1': [{ labwareId: '123', volumeByWell: { A1: 30 } }],
    })
  })
  it('renders the display name, description and total volume', () => {
    const [{ getAllByText }] = render(props)
    getAllByText('mock liquids list item')
  })
})
