import * as React from 'react'
import { when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useProtocolLiquids } from '../../../Protocols/hooks'
import { Liquids } from '../Liquids'

jest.mock('../../../Protocols/hooks')

const mockUseProtocolLiquids = useProtocolLiquids as jest.MockedFunction<
  typeof useProtocolLiquids
>
const MOCK_PROTOCOL_ID = 'mock_protocol_id'
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
      volumeByWell: { A1: 50 },
    },
  ],
  '1': [
    {
      labwareId: '234',
      volumeByWell: { B1: 22 },
    },
  ],
}

const render = (props: React.ComponentProps<typeof Liquids>) => {
  return renderWithProviders(<Liquids {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Liquids', () => {
  let props: React.ComponentProps<typeof Liquids>
  beforeEach(() => {
    props = {
      protocolId: MOCK_PROTOCOL_ID,
    }
    when(mockUseProtocolLiquids).mockReturnValue({
      liquidsInOrder: MOCK_LIQUIDS_IN_LOAD_ORDER,
      labwareByLiquidId: MOCK_LABWARE_INFO_BY_LIQUID_ID,
    })
  })
  it('should render the correct headers and liquids', () => {
    const { getByRole, getByText, getByLabelText } = render(props)[0]
    getByRole('columnheader', { name: 'liquid name' })
    getByRole('columnheader', { name: 'total volume' })
    getByText('mock liquid 1')
    getByText('mock sample')
    getByText('50 µL')
    getByLabelText('Liquids_#ff4888')
    getByText('mock liquid 2')
    getByText('another mock sample')
    getByText('22 µL')
    getByLabelText('Liquids_#ff8999')
  })
})
