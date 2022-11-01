import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useTrackEvent } from '../../../redux/analytics'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getSendAllProtocolsToOT3 } from '../../../redux/config'
import {
  analyzeProtocol,
  removeProtocol,
  viewProtocolSourceFolder,
} from '../../../redux/protocol-storage'

import { ProtocolOverflowMenu } from '../ProtocolOverflowMenu'

jest.mock('../../../redux/analytics')
jest.mock('../../../redux/config')
jest.mock('../../../redux/protocol-storage')

const PROTOCOL_KEY = 'mock-protocol-key'
const mockHandleRunProtocol = jest.fn()

const mockViewProtocolSourceFolder = viewProtocolSourceFolder as jest.MockedFunction<
  typeof viewProtocolSourceFolder
>
const mockRemoveProtocol = removeProtocol as jest.MockedFunction<
  typeof removeProtocol
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockGetSendAllProtocolsToOT3 = getSendAllProtocolsToOT3 as jest.MockedFunction<
  typeof getSendAllProtocolsToOT3
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolOverflowMenu
        protocolKey={PROTOCOL_KEY}
        handleRunProtocol={mockHandleRunProtocol}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

let mockTrackEvent: jest.Mock

describe('ProtocolOverflowMenu', () => {
  beforeEach(() => {
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockGetSendAllProtocolsToOT3.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render label when clicking overflowMenu', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    getByText('Show in folder')
    getByText('Run now')
    getByText('Delete')
  })

  it('should call run protocol when clicking run now button', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const runButton = getByText('Run now')
    fireEvent.click(runButton)
    expect(mockHandleRunProtocol).toHaveBeenCalled()
  })

  it('should call reanalyze when clicking reanalyze', () => {
    const [{ getByTestId, getByText }, store] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const reanalyzeButton = getByText('Reanalyze')
    fireEvent.click(reanalyzeButton)

    expect(store.dispatch).toHaveBeenCalledWith(analyzeProtocol(PROTOCOL_KEY))
  })

  it('should call send to OT-3 when clicking send to OT-3', () => {
    mockGetSendAllProtocolsToOT3.mockReturnValue(true)

    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const sendToOT3Button = getByText('Send to OT-3')
    fireEvent.click(sendToOT3Button)
    // TODO(bh, 2022-10-12): implement send to ot-3
  })

  it('should call folder open function when clicking show in folder', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const folderButton = getByText('Show in folder')
    fireEvent.click(folderButton)
    expect(mockViewProtocolSourceFolder).toHaveBeenCalled()
  })

  it('should render modal when clicking delete button', () => {
    const [{ getByTestId, getByText, getByRole }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = getByText('Delete')
    fireEvent.click(deleteButton)
    getByText('Delete this protocol?')
    getByText(
      'This protocol will be moved to this computer’s trash and may be unrecoverable.'
    )
    getByRole('button', { name: 'Yes, delete protocol' })
    getByRole('button', { name: 'cancel' })
  })

  it('should call delete function when clicking yes button', () => {
    const [{ getByTestId, getByText, getByRole }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = getByText('Delete')
    fireEvent.click(deleteButton)
    const yesButton = getByRole('button', { name: 'Yes, delete protocol' })
    fireEvent.click(yesButton)
    expect(mockRemoveProtocol).toHaveBeenCalled()
  })

  it('should close modal when clicking cancel button', () => {
    const [{ getByTestId, getByText, getByRole, queryByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = getByText('Delete')
    fireEvent.click(deleteButton)
    const cancelButton = getByRole('button', { name: 'cancel' })
    fireEvent.click(cancelButton)
    expect(queryByText('Delete this protocol?')).not.toBeInTheDocument()
  })
})
