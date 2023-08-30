import * as React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { getProtocolsDesktopSortKey } from '../../../redux/config'
import {
  storedProtocolData,
  storedProtocolDataTwo,
} from '../../../redux/protocol-storage/__fixtures__'
import { ProtocolList } from '../ProtocolList'
import { useSortedProtocols } from '../hooks'
import { EmptyStateLinks } from '../EmptyStateLinks'
import { ProtocolCard } from '../ProtocolCard'

jest.mock('../hooks')
jest.mock('../../../redux/protocol-storage')
jest.mock('../../../redux/config')
jest.mock('../EmptyStateLinks')
jest.mock('../ProtocolCard')

const mockUseSortedProtocols = useSortedProtocols as jest.MockedFunction<
  typeof useSortedProtocols
>
const mockEmptyStateLinks = EmptyStateLinks as jest.MockedFunction<
  typeof EmptyStateLinks
>
const mockProtocolCard = ProtocolCard as jest.MockedFunction<
  typeof ProtocolCard
>
const mockGetProtocolsDesktopSortKey = getProtocolsDesktopSortKey as jest.MockedFunction<
  typeof getProtocolsDesktopSortKey
>

const render = (props: React.ComponentProps<typeof ProtocolList>) => {
  return renderWithProviders(
    <BrowserRouter>
      <ProtocolList {...props} />
    </BrowserRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('ProtocolList', () => {
  let props: React.ComponentProps<typeof ProtocolList>

  beforeEach(() => {
    props = {
      storedProtocols: [storedProtocolData, storedProtocolDataTwo],
    }
    when(mockProtocolCard).mockReturnValue(<div>mock protocol card</div>)
    when(mockEmptyStateLinks).mockReturnValue(<div>mock empty state links</div>)
    when(mockUseSortedProtocols)
      .calledWith('alphabetical', [storedProtocolData, storedProtocolDataTwo])
      .mockReturnValue([storedProtocolData, storedProtocolDataTwo])
    when(mockGetProtocolsDesktopSortKey).mockReturnValue('alphabetical')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the heading, correct info for 2 protocols, and in alphabetical order', () => {
    const { getByText, getAllByText, getByRole } = render(props)

    getByRole('heading', { name: 'Protocols' })
    getByText('Sort by')
    getByText('Alphabetical')
    getByRole('button', { name: 'Import' })
    getByText('mock empty state links')
    const cards = getAllByText('mock protocol card')
    expect(cards.length).toBe(2)
  })

  it('renders and clicks on import button and opens slideout', () => {
    const { getByText, getByRole } = render(props)
    const btn = getByRole('button', { name: 'Import' })
    fireEvent.click(btn)
    getByText('Import a Protocol')
  })

  it('renders Alphabetical button and clicking on it open overflow menu and can select alphabetical', () => {
    const { getByRole, getByTestId } = render(props)
    fireEvent.click(getByTestId('ProtocolList_SortByMenu'))
    const alphabetical = getByRole('button', { name: 'Alphabetical' })
    getByRole('button', { name: 'Most recent updates' })
    getByRole('button', { name: 'Reverse alphabetical' })
    getByRole('button', { name: 'Oldest updates' })
    fireEvent.click(alphabetical)
    expect(mockUseSortedProtocols).toHaveBeenCalledWith('alphabetical', [
      storedProtocolData,
      storedProtocolDataTwo,
    ])
  })

  it('renders Alphabetical button and clicking on it open overflow menu and can select reverse', () => {
    when(mockUseSortedProtocols)
      .calledWith('reverse', [storedProtocolData, storedProtocolDataTwo])
      .mockReturnValue([storedProtocolDataTwo, storedProtocolData])
    when(mockGetProtocolsDesktopSortKey).mockReturnValue('reverse')

    const { getByRole, getByText, getByTestId } = render(props)
    fireEvent.click(getByTestId('ProtocolList_SortByMenu'))
    getByRole('button', { name: 'Alphabetical' })
    getByRole('button', { name: 'Most recent updates' })
    const reverse = getByRole('button', { name: 'Reverse alphabetical' })
    getByRole('button', { name: 'Oldest updates' })
    fireEvent.click(reverse)
    getByText('Reverse alphabetical')
  })

  it('renders Alphabetical button and clicking on it open overflow menu and can select recent', () => {
    when(mockUseSortedProtocols)
      .calledWith('recent', [storedProtocolData, storedProtocolDataTwo])
      .mockReturnValue([storedProtocolData, storedProtocolDataTwo])
    when(mockGetProtocolsDesktopSortKey).mockReturnValue('recent')

    const { getByRole, getByText, getByTestId } = render(props)
    fireEvent.click(getByTestId('ProtocolList_SortByMenu'))
    getByRole('button', { name: 'Alphabetical' })
    const recent = getByRole('button', { name: 'Most recent updates' })
    getByRole('button', { name: 'Reverse alphabetical' })
    getByRole('button', { name: 'Oldest updates' })
    fireEvent.click(recent)
    getByText('Most recent updates')
  })

  it('renders Alphabetical button and clicking on it open overflow menu and can select oldest', () => {
    when(mockUseSortedProtocols)
      .calledWith('oldest', [storedProtocolData, storedProtocolDataTwo])
      .mockReturnValue([storedProtocolDataTwo, storedProtocolData])
    when(mockGetProtocolsDesktopSortKey).mockReturnValue('oldest')

    const { getByRole, getByText, getByTestId } = render(props)
    fireEvent.click(getByTestId('ProtocolList_SortByMenu'))
    getByRole('button', { name: 'Alphabetical' })
    getByRole('button', { name: 'Most recent updates' })
    getByRole('button', { name: 'Reverse alphabetical' })
    const oldest = getByRole('button', { name: 'Oldest updates' })
    fireEvent.click(oldest)
    getByText('Oldest updates')
  })

  it('renders Alphabetical as the sort key when alphabetical was selected last time', () => {
    const { getByText } = render(props)
    getByText('Alphabetical')
  })

  it('renders Oldest updates as the sort key when oldest was selected last time', () => {
    when(mockGetProtocolsDesktopSortKey).mockReturnValue('oldest')
    const { getByText } = render(props)
    getByText('Oldest updates')
  })

  it('renders Flex as the sort key when flex was selected last time', () => {
    when(mockUseSortedProtocols)
      .calledWith('flex', [storedProtocolData, storedProtocolDataTwo])
      .mockReturnValue([storedProtocolData, storedProtocolDataTwo])
    when(mockGetProtocolsDesktopSortKey).mockReturnValue('flex')
    const { getByText } = render(props)
    getByText('Flex protocols first')
  })

  it('renders ot2 as the sort key when ot2 was selected last time', () => {
    when(mockUseSortedProtocols)
      .calledWith('ot2', [storedProtocolData, storedProtocolDataTwo])
      .mockReturnValue([storedProtocolData, storedProtocolDataTwo])
    when(mockGetProtocolsDesktopSortKey).mockReturnValue('ot2')
    const { getByText } = render(props)
    getByText('OT-2 protocols first')
  })
})
