import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useTrackEvent } from '../../../redux/analytics'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  analyzeProtocol,
  removeProtocol,
  viewProtocolSourceFolder,
} from '../../../redux/protocol-storage'

import { ProtocolOverflowMenu } from '../ProtocolOverflowMenu'

jest.mock('../../../redux/analytics')
jest.mock('../../../redux/protocol-storage')

const PROTOCOL_KEY = 'mock-protocol-key'
const mockHandleRunProtocol = jest.fn()

const mockAnalyzeProtocol = analyzeProtocol as jest.MockedFunction<
  typeof analyzeProtocol
>
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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render label when clicking overflowMenu', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    getByText('Show in folder')
    getByText('Run')
    getByText('Delete protocol')
  })

  it('should call run protocol when clicking run button', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const runButton = getByText('Run')
    fireEvent.click(runButton)
    expect(mockHandleRunProtocol).toHaveBeenCalled()
  })

  it('should call reanalyze protocol when clicking run button', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const reanalyzeButton = getByText('Reanalyze')
    fireEvent.click(reanalyzeButton)
    expect(mockAnalyzeProtocol).toHaveBeenCalled()
  })

  it('should call folder open function when clicking show in folder', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const folderButton = getByText('Show in folder')
    fireEvent.click(folderButton)
    expect(mockViewProtocolSourceFolder).toHaveBeenCalled()
  })

  it('should render modal when clicking delete protocol button', () => {
    const [{ getByTestId, getByText, getByRole }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = getByText('Delete protocol')
    fireEvent.click(deleteButton)
    getByText('Delete this protocol?')
    getByText(
      'This protocol will be moved to this computer’s trash and may be unrecoverable.'
    )
    getByRole('button', { name: 'Yes, delete protocol' })
    getByRole('button', { name: 'cancel' })
  })

  it('should call detele function when clicking yes button', () => {
    const [{ getByTestId, getByText, getByRole }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = getByText('Delete protocol')
    fireEvent.click(deleteButton)
    const yesButton = getByRole('button', { name: 'Yes, delete protocol' })
    fireEvent.click(yesButton)
    expect(mockRemoveProtocol).toHaveBeenCalled()
  })

  it('should close modal when clicking cancel button', () => {
    const [{ getByTestId, getByText, getByRole, queryByText }] = render()
    const button = getByTestId('ProtocolOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = getByText('Delete protocol')
    fireEvent.click(deleteButton)
    const cancelButton = getByRole('button', { name: 'cancel' })
    fireEvent.click(cancelButton)
    expect(queryByText('Delete this protocol?')).not.toBeInTheDocument()
  })
})
