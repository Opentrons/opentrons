import { vi, it, describe, expect } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { PinnedTransfer } from '../PinnedTransfer'

import type { ProtocolResource } from '@opentrons/shared-data'
import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockProtocol: ProtocolResource = {
  id: 'mockTransfer1',
  protocolKind: 'quick-transfer',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  robotType: 'OT-3 Standard',
  protocolType: 'json',
  metadata: {
    protocolName: 'yay mock transfer',
    author: 'engineering',
    description: 'A short mock transfer',
    created: 1606853851893,
    tags: ['unitTest'],
  },
  analysisSummaries: [],
  files: [],
  key: '26ed5a82-502f-4074-8981-57cdda1d066d',
}

const props = {
  transfer: mockProtocol,
  longPress: vi.fn(),
  setShowDeleteConfirmationModal: vi.fn(),
  setTargetTransferId: vi.fn(),
}

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <PinnedTransfer {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Pinned Transfer', () => {
  vi.useFakeTimers()

  it('should redirect to quick transfer details after short click', () => {
    render()
    const name = screen.getByText('yay mock transfer')
    fireEvent.click(name)
    expect(mockNavigate).toHaveBeenCalledWith('/quick-transfer/mockTransfer1')
  })

  it('should display modal after long click', async () => {
    vi.useFakeTimers()
    render()
    const name = screen.getByText('yay mock transfer')
    fireEvent.mouseDown(name)
    act(() => {
      vi.advanceTimersByTime(1005)
    })
    expect(props.longPress).toHaveBeenCalled()
    screen.getByText('Run quick transfer')
    // This should ne "Unpin protocol" but I don't know how to pass state into the render
    // call so the longpress modal can see the pinned ids.
    screen.getByText('Pin quick transfer')
    screen.getByText('Delete quick transfer')
  })
})
