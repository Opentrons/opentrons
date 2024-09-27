import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '/app/redux/analytics'
import { storedProtocolData } from '/app/redux/protocol-storage/__fixtures__'
import {
  analyzeProtocol,
  removeProtocol,
  viewProtocolSourceFolder,
} from '/app/redux/protocol-storage'

import { ProtocolOverflowMenu } from '../ProtocolOverflowMenu'

import type { Mock } from 'vitest'

vi.mock('/app/redux/analytics')
vi.mock('/app/redux/protocol-storage')

const mockHandleRunProtocol = vi.fn()
const mockHandleSendProtocolToFlex = vi.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolOverflowMenu
        handleRunProtocol={mockHandleRunProtocol}
        handleSendProtocolToFlex={mockHandleSendProtocolToFlex}
        storedProtocolData={storedProtocolData}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

let mockTrackEvent: Mock

describe('ProtocolOverflowMenu', () => {
  beforeEach(() => {
    mockTrackEvent = vi.fn()
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render label when clicking overflowMenu', () => {
    render()
    const button = screen.getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    screen.getByText('Show in folder')
    screen.getByText('Start setup')
    screen.getByText('Delete')
  })

  it('should call run protocol when clicking Start setup button', () => {
    render()
    const button = screen.getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const runButton = screen.getByText('Start setup')
    fireEvent.click(runButton)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { sourceLocation: 'ProtocolsLanding' },
    })
    expect(mockHandleRunProtocol).toHaveBeenCalledWith(storedProtocolData)
  })

  it('should call reanalyze when clicking reanalyze', () => {
    const store = render()[1]
    const button = screen.getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const reanalyzeButton = screen.getByText('Reanalyze')
    fireEvent.click(reanalyzeButton)

    expect(store.dispatch).toHaveBeenCalledWith(
      analyzeProtocol(storedProtocolData.protocolKey)
    )
  })

  it('should call folder open function when clicking show in folder', () => {
    render()
    const button = screen.getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const folderButton = screen.getByText('Show in folder')
    fireEvent.click(folderButton)
    expect(vi.mocked(viewProtocolSourceFolder)).toHaveBeenCalled()
  })

  it('should render modal when clicking delete button', () => {
    render()
    const button = screen.getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    screen.getByText('Delete this protocol?')
    screen.getByText(
      'This protocol will be moved to this computer’s trash and may be unrecoverable.'
    )
    screen.getByRole('button', { name: 'Yes, delete protocol' })
    screen.getByRole('button', { name: 'cancel' })
  })

  it('should call delete function when clicking yes button', () => {
    render()
    const button = screen.getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    const yesButton = screen.getByRole('button', {
      name: 'Yes, delete protocol',
    })
    fireEvent.click(yesButton)
    expect(vi.mocked(removeProtocol)).toHaveBeenCalled()
  })

  it('should close modal when clicking cancel button', () => {
    render()
    const button = screen.getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    const cancelButton = screen.getByRole('button', { name: 'cancel' })
    fireEvent.click(cancelButton)
    expect(screen.queryByText('Delete this protocol?')).not.toBeInTheDocument()
  })
})
