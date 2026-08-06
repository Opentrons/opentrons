import { BrowserRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getProtocolsDesktopSortKey } from '/app/redux/config'
import {
  storedProtocolData,
  storedProtocolDataTwo,
} from '/app/redux/protocol-storage/__fixtures__'
import { useSortedProtocols } from '/app/resources/protocols/hooks'

import { EmptyStateLinks } from '../EmptyStateLinks'
import { ProtocolCard } from '../ProtocolCard'
import { ProtocolList } from '../ProtocolList'

import type { ComponentProps } from 'react'

vi.mock('/app/resources/protocols/hooks')
vi.mock('/app/redux/protocol-storage')
vi.mock('/app/redux/config')
vi.mock('../EmptyStateLinks')
vi.mock('../ProtocolCard')

const render = (props: ComponentProps<typeof ProtocolList>) => {
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
  let props: ComponentProps<typeof ProtocolList>

  beforeEach(() => {
    props = {
      storedProtocols: [storedProtocolData, storedProtocolDataTwo],
    }
    vi.mocked(ProtocolCard).mockReturnValue(<div>mock protocol card</div>)
    vi.mocked(EmptyStateLinks).mockReturnValue(
      <div>mock empty state links</div>
    )
    when(vi.mocked(useSortedProtocols))
      .calledWith('alphabetical', [storedProtocolData, storedProtocolDataTwo])
      .thenReturn([storedProtocolData, storedProtocolDataTwo])
    vi.mocked(getProtocolsDesktopSortKey).mockReturnValue('alphabetical')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the heading, correct info for 2 protocols, and in alphabetical order', () => {
    render(props)

    screen.getByRole('heading', { name: 'Protocols' })
    screen.getByText('Sort by')
    screen.getByText('Alphabetical')
    screen.getByRole('button', { name: 'Import' })
    screen.getByText('mock empty state links')
    const cards = screen.getAllByText('mock protocol card')
    expect(cards.length).toBe(2)
  })

  it('renders and clicks on import button and opens slideout', () => {
    render(props)
    const btn = screen.getByRole('button', { name: 'Import' })
    fireEvent.click(btn)
    screen.getByText('Import a Protocol')
  })

  it('renders Alphabetical button and clicking on it open overflow menu and can select alphabetical', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ProtocolList_SortByMenu'))
    const alphabetical = screen.getByRole('button', { name: 'Alphabetical' })
    screen.getByRole('button', { name: 'Most recent updates' })
    screen.getByRole('button', { name: 'Reverse alphabetical' })
    screen.getByRole('button', { name: 'Oldest updates' })
    fireEvent.click(alphabetical)
    expect(vi.mocked(useSortedProtocols)).toHaveBeenCalledWith('alphabetical', [
      storedProtocolData,
      storedProtocolDataTwo,
    ])
  })

  it('renders Alphabetical button and clicking on it open overflow menu and can select reverse', () => {
    when(vi.mocked(useSortedProtocols))
      .calledWith('reverse', [storedProtocolData, storedProtocolDataTwo])
      .thenReturn([storedProtocolDataTwo, storedProtocolData])
    vi.mocked(getProtocolsDesktopSortKey).mockReturnValue('reverse')

    render(props)
    fireEvent.click(screen.getByTestId('ProtocolList_SortByMenu'))
    screen.getByRole('button', { name: 'Alphabetical' })
    screen.getByRole('button', { name: 'Most recent updates' })
    const reverse = screen.getByRole('button', { name: 'Reverse alphabetical' })
    screen.getByRole('button', { name: 'Oldest updates' })
    fireEvent.click(reverse)
    screen.getByText('Reverse alphabetical')
  })

  it('renders Alphabetical button and clicking on it open overflow menu and can select recent', () => {
    when(vi.mocked(useSortedProtocols))
      .calledWith('recent', [storedProtocolData, storedProtocolDataTwo])
      .thenReturn([storedProtocolData, storedProtocolDataTwo])
    vi.mocked(getProtocolsDesktopSortKey).mockReturnValue('recent')

    render(props)
    fireEvent.click(screen.getByTestId('ProtocolList_SortByMenu'))
    screen.getByRole('button', { name: 'Alphabetical' })
    const recent = screen.getByRole('button', { name: 'Most recent updates' })
    screen.getByRole('button', { name: 'Reverse alphabetical' })
    screen.getByRole('button', { name: 'Oldest updates' })
    fireEvent.click(recent)
    screen.getByText('Most recent updates')
  })

  it('renders Alphabetical button and clicking on it open overflow menu and can select oldest', () => {
    when(vi.mocked(useSortedProtocols))
      .calledWith('oldest', [storedProtocolData, storedProtocolDataTwo])
      .thenReturn([storedProtocolDataTwo, storedProtocolData])
    vi.mocked(getProtocolsDesktopSortKey).mockReturnValue('oldest')

    render(props)
    fireEvent.click(screen.getByTestId('ProtocolList_SortByMenu'))
    screen.getByRole('button', { name: 'Alphabetical' })
    screen.getByRole('button', { name: 'Most recent updates' })
    screen.getByRole('button', { name: 'Reverse alphabetical' })
    const oldest = screen.getByRole('button', { name: 'Oldest updates' })
    fireEvent.click(oldest)
    screen.getByText('Oldest updates')
  })

  it('renders Alphabetical as the sort key when alphabetical was selected last time', () => {
    render(props)
    screen.getByText('Alphabetical')
  })

  it('renders Oldest updates as the sort key when oldest was selected last time', () => {
    vi.mocked(getProtocolsDesktopSortKey).mockReturnValue('oldest')
    render(props)
    screen.getByText('Oldest updates')
  })

  it('falls back to alphabetical when the stored sort key is invalid', () => {
    vi.mocked(getProtocolsDesktopSortKey).mockReturnValue('newest' as any)

    render(props)

    expect(vi.mocked(useSortedProtocols)).toHaveBeenCalledWith('alphabetical', [
      storedProtocolData,
      storedProtocolDataTwo,
    ])
    screen.getByText('Alphabetical')
  })
})
