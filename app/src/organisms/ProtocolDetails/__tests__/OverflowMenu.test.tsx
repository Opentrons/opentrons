import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  removeProtocol,
  viewProtocolSourceFolder,
  analyzeProtocol,
} from '../../../redux/protocol-storage'

import { OverflowMenu } from '../OverflowMenu'

jest.mock('../../../redux/protocol-storage')

const PROTOCOL_KEY = 'mock-protocol-key'

const mockViewProtocolSourceFolder = viewProtocolSourceFolder as jest.MockedFunction<
  typeof viewProtocolSourceFolder
>
const mockRemoveProtocol = removeProtocol as jest.MockedFunction<
  typeof removeProtocol
>
const mockAnalyzeProtocol = analyzeProtocol as jest.MockedFunction<
  typeof analyzeProtocol
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <OverflowMenu protocolKey={PROTOCOL_KEY} protocolType="json" />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('ProtocolDetailsOverflowMenu', () => {
  beforeEach(() => {})

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render label when clicking overflowMenu', () => {
    const [{ getByTestId, getByText, getByRole }] = render()
    const button = getByTestId('ProtocolDetailsOverflowMenu_overflowBtn')
    fireEvent.click(button)
    getByText('Show in folder')
    getByText('Reanalyze')
    getByText('Delete protocol')
    getByRole('link', { name: 'Open Protocol Designer' })
  })

  it('should call folder open function when clicking show in folder', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolDetailsOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const folderButton = getByText('Show in folder')
    fireEvent.click(folderButton)
    expect(mockViewProtocolSourceFolder).toHaveBeenCalled()
  })

  it('should call analyze function when clicking reanalyze', () => {
    const [{ getByTestId, getByText }] = render()
    const button = getByTestId('ProtocolDetailsOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const analyzeBtn = getByText('Reanalyze')
    fireEvent.click(analyzeBtn)
    expect(mockAnalyzeProtocol).toHaveBeenCalled()
  })

  it('should render modal when clicking delete protocol button', () => {
    const [{ getByTestId, getByText, getByRole }] = render()
    const button = getByTestId('ProtocolDetailsOverflowMenu_overflowBtn')
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
    const button = getByTestId('ProtocolDetailsOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = getByText('Delete protocol')
    fireEvent.click(deleteButton)
    const yesButton = getByRole('button', { name: 'Yes, delete protocol' })
    fireEvent.click(yesButton)
    expect(mockRemoveProtocol).toHaveBeenCalled()
  })

  it('should close modal when clicking cancel button', () => {
    const [{ getByTestId, getByText, getByRole, queryByText }] = render()
    const button = getByTestId('ProtocolDetailsOverflowMenu_overflowBtn')
    fireEvent.click(button)
    const deleteButton = getByText('Delete protocol')
    fireEvent.click(deleteButton)
    const cancelButton = getByRole('button', { name: 'cancel' })
    fireEvent.click(cancelButton)
    expect(queryByText('Delete this protocol?')).not.toBeInTheDocument()
  })
})
