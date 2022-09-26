import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { ProtocolsEmptyState } from '../../../../organisms/ProtocolsLanding/ProtocolsEmptyState'
import { getStoredProtocols } from '../../../../redux/protocol-storage'
import { storedProtocolData } from '../../../../redux/protocol-storage/__fixtures__'
import { ProtocolList } from '../../../../organisms/ProtocolsLanding/ProtocolList'
import { ProtocolsLanding } from '..'

jest.mock('../../../../redux/protocol-storage')
jest.mock('../../../../organisms/ProtocolsLanding/ProtocolsEmptyState')
jest.mock('../../../../organisms/ProtocolsLanding/ProtocolList')

const mockGetStoredProtocols = getStoredProtocols as jest.MockedFunction<
  typeof getStoredProtocols
>
const mockProtocolList = ProtocolList as jest.MockedFunction<
  typeof ProtocolList
>
const mockProtocolsEmptyState = ProtocolsEmptyState as jest.MockedFunction<
  typeof ProtocolsEmptyState
>

const render = () => {
  return renderWithProviders(<ProtocolsLanding />)[0]
}

describe('ProtocolsLanding', () => {
  it('renders the protocol list component', () => {
    mockGetStoredProtocols.mockReturnValue([storedProtocolData])
    mockProtocolList.mockReturnValue(<div>mock protocol list</div>)
    const { getByText } = render()
    getByText('mock protocol list')
  })
  it('renders the empty state component', () => {
    mockGetStoredProtocols.mockReturnValue([])
    mockProtocolsEmptyState.mockReturnValue(<div>mock empty state</div>)
    const { getByText } = render()
    getByText('mock empty state')
  })
})
