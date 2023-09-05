import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'
import { i18n } from '../../../i18n'
import { ProtocolLiquidsDetails } from '../ProtocolLiquidsDetails'
import { LiquidsListItemDetails } from '../../Devices/ProtocolRun/SetupLiquids/SetupLiquidsList'

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
  return renderWithProviders(<ProtocolLiquidsDetails {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolLiquidsDetails', () => {
  let props: React.ComponentProps<typeof ProtocolLiquidsDetails>
  beforeEach(() => {
    props = {
      commands: [],
      liquids: [
        {
          id: 'mockLiquid',
          displayName: 'mockDisplayName',
          description: 'mockDescription',
        },
      ],
    }
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
  it('renders the correct info for no liquids in the protocol', () => {
    props.liquids = []
    const [{ getByText, getByLabelText }] = render(props)
    getByText('No liquids are specified for this protocol')
    getByLabelText('ProtocolLIquidsDetails_noLiquidsIcon')
  })
})
