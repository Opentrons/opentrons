import { vi, it, describe } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '/app/__testing-utils__'

import { ProtocolsEmptyState } from '/app/organisms/Desktop/ProtocolsLanding/ProtocolsEmptyState'
import { getStoredProtocols } from '/app/redux/protocol-storage'
import { storedProtocolData } from '/app/redux/protocol-storage/__fixtures__'
import { ProtocolList } from '/app/organisms/Desktop/ProtocolsLanding/ProtocolList'
import { ProtocolsLanding } from '..'

vi.mock('/app/redux/protocol-storage')
vi.mock('/app/organisms/Desktop/ProtocolsLanding/ProtocolsEmptyState')
vi.mock('/app/organisms/Desktop/ProtocolsLanding/ProtocolList')

const render = () => {
  return renderWithProviders(<ProtocolsLanding />)[0]
}

describe('ProtocolsLanding', () => {
  it('renders the protocol list component', () => {
    vi.mocked(getStoredProtocols).mockReturnValue([storedProtocolData])
    vi.mocked(ProtocolList).mockReturnValue(<div>mock protocol list</div>)
    render()
    screen.getByText('mock protocol list')
  })
  it('renders the empty state component', () => {
    vi.mocked(getStoredProtocols).mockReturnValue([])
    vi.mocked(ProtocolsEmptyState).mockReturnValue(<div>mock empty state</div>)
    render()
    screen.getByText('mock empty state')
  })
})
