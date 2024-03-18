import * as React from 'react'
import { vi, it, describe } from 'vitest'
import { renderWithProviders } from '../../../../__testing-utils__'

import { ProtocolsEmptyState } from '../../../../organisms/ProtocolsLanding/ProtocolsEmptyState'
import { getStoredProtocols } from '../../../../redux/protocol-storage'
import { storedProtocolData } from '../../../../redux/protocol-storage/__fixtures__'
import { ProtocolList } from '../../../../organisms/ProtocolsLanding/ProtocolList'
import { ProtocolsLanding } from '..'

vi.mock('../../../../redux/protocol-storage')
vi.mock('../../../../organisms/ProtocolsLanding/ProtocolsEmptyState')
vi.mock('../../../../organisms/ProtocolsLanding/ProtocolList')

const render = () => {
  return renderWithProviders(<ProtocolsLanding />)[0]
}

describe('ProtocolsLanding', () => {
  it('renders the protocol list component', () => {
    vi.mocked(getStoredProtocols).mockReturnValue([storedProtocolData])
    vi.mocked(ProtocolList).mockReturnValue(<div>mock protocol list</div>)
    const { getByText } = render()
    getByText('mock protocol list')
  })
  it('renders the empty state component', () => {
    vi.mocked(getStoredProtocols).mockReturnValue([])
    vi.mocked(ProtocolsEmptyState).mockReturnValue(<div>mock empty state</div>)
    const { getByText } = render()
    getByText('mock empty state')
  })
})
