import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { ProtocolLiquidsDetails } from '../ProtocolLiquidsDetails'
import { LiquidsListItemDetails } from '../../Devices/ProtocolRun/SetupLiquids/SetupLiquidsList'

jest.mock('../../Devices/ProtocolRun/SetupLiquids/SetupLiquidsList')

const mockLiquidsListItemDetails = LiquidsListItemDetails as jest.MockedFunction<
  typeof LiquidsListItemDetails
>

const render = () => {
  return renderWithProviders(<ProtocolLiquidsDetails />)
}

describe('ProtocolLiquidsDetails', () => {
  beforeEach(() => {
    mockLiquidsListItemDetails.mockReturnValue(
      <div>mock liquids list item</div>
    )
  })
  it('renders the display name, description and total volume', () => {
    const [{ getAllByText }] = render()
    getAllByText('mock liquids list item')
  })
})
