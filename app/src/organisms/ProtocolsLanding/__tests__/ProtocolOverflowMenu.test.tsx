import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../../redux/analytics'
import { storedProtocolData } from '../../../redux/protocol-storage/__fixtures__'
import {
  analyzeProtocol,
  removeProtocol,
  viewProtocolSourceFolder,
} from '../../../redux/protocol-storage'

import { ProtocolOverflowMenu } from '../ProtocolOverflowMenu'

jest.mock('../../../redux/analytics')
jest.mock('../../../redux/protocol-storage')

const mockHandleRunProtocol = jest.fn()
const mockHandleSendProtocolToOT3 = jest.fn()

const mockViewProtocolSourceFolder = viewProtocolSourceFolder as jest.MockedFunction<
  typeof viewProtocolSourceFolder
>
const mockRemoveProtocol = removeProtocol as jest.MockedFunction<
  typeof removeProtocol
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolOverflowMenu
        handleRunProtocol={mockHandleRunProtocol}
        handleSendProtocolToOT3={mockHandleSendProtocolToOT3}
        storedProtocolData={storedProtocolData}
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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render label when clicking overflowMenu', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    getByText('Show in folder')
    getByText('Start setup')
    getByText('Delete')
  })

  it('should call run protocol when clicking Start setup button', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const runButton = getByText('Start setup')
    fireEvent.click(runButton)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { sourceLocation: 'ProtocolsLanding' },
    })
    expect(mockHandleRunProtocol).toHaveBeenCalledWith(storedProtocolData)
  })

  it('should call reanalyze when clicking reanalyze', () => {
    const [{ getByTestId, getByText }, store] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const reanalyzeButton = getByText('Reanalyze')
    fireEvent.click(reanalyzeButton)

    expect(store.dispatch).toHaveBeenCalledWith(
      analyzeProtocol(storedProtocolData.protocolKey)
    )
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
