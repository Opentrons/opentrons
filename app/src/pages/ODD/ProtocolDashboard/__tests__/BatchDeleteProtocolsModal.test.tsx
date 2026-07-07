import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useToaster } from '/app/organisms/ToasterOven'

import { BatchDeleteProtocolsModal } from '../BatchDeleteProtocolsModal'
import { useDeleteProtocols } from '../useDeleteProtocols'

import type { ComponentProps } from 'react'
import type { ProtocolResource } from '@opentrons/shared-data'

vi.mock('/app/organisms/ToasterOven')
vi.mock('../useDeleteProtocols')

const mockOnClose = vi.fn()
const mockMakeSnackbar = vi.fn()
const mockDeleteProtocols = vi.fn()

const mockProtocol1 = {
  id: 'protocol1',
  metadata: { protocolName: 'mock protocol 1' },
  files: [{ name: 'protocol1.json' }],
} as ProtocolResource

const mockProtocol2 = {
  id: 'protocol2',
  metadata: { protocolName: 'mock protocol 2' },
  files: [{ name: 'protocol2.json' }],
} as ProtocolResource

const render = (props: ComponentProps<typeof BatchDeleteProtocolsModal>) => {
  return renderWithProviders(<BatchDeleteProtocolsModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('BatchDeleteProtocolsModal', () => {
  let props: ComponentProps<typeof BatchDeleteProtocolsModal>

  beforeEach(() => {
    props = {
      protocols: [mockProtocol1, mockProtocol2],
      onClose: mockOnClose,
    }
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    })
    vi.mocked(useDeleteProtocols).mockReturnValue({
      deleteProtocols: mockDeleteProtocols,
      isDeleting: false,
    })
    mockDeleteProtocols.mockResolvedValue({ failedIds: [] })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a count-based header, protocol names, and action buttons', () => {
    render(props)
    screen.getByText('Delete 2 protocols?')
    screen.getByText('mock protocol 1')
    screen.getByText('mock protocol 2')
    screen.getByText('Cancel')
    screen.getByText('Delete')
  })

  it('closes without deleting when tapping cancel', () => {
    render(props)
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
    expect(mockDeleteProtocols).not.toHaveBeenCalled()
  })

  it('deletes all selected protocols and shows a success snackbar', async () => {
    render(props)
    act(() => {
      screen.getByText('Delete').click()
    })
    await new Promise(setImmediate)

    expect(mockDeleteProtocols).toHaveBeenCalledWith(['protocol1', 'protocol2'])
    expect(mockMakeSnackbar).toHaveBeenCalledWith('2 protocols deleted')
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows a partial-failure snackbar when some protocols fail to delete', async () => {
    mockDeleteProtocols.mockResolvedValue({ failedIds: ['protocol2'] })
    render(props)
    act(() => {
      screen.getByText('Delete').click()
    })
    await new Promise(setImmediate)

    expect(mockMakeSnackbar).toHaveBeenCalledWith('Deleted 1 of 2 protocols')
    expect(mockOnClose).toHaveBeenCalled()
  })
})
