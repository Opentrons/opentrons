import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { deleteRun, getProtocol } from '@opentrons/api-client'
import {
  useDeleteProtocolMutation,
  useHost,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useToaster } from '/app/organisms/ToasterOven'

import { DeleteProtocolConfirmationModal } from '../DeleteProtocolConfirmationModal'

import type { ComponentProps } from 'react'
import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/organisms/ToasterOven')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const mockFunc = vi.fn()
const PROTOCOL_ID = 'mockProtocolId'
const mockMakeSnackbar = vi.fn()
const mockDeleteProtocol = vi.fn()
const MOCK_HOST_CONFIG = {} as HostConfig

const render = (
  props: ComponentProps<typeof DeleteProtocolConfirmationModal>
) => {
  return renderWithProviders(<DeleteProtocolConfirmationModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeleteProtocolConfirmationModal', () => {
  let props: ComponentProps<typeof DeleteProtocolConfirmationModal>

  beforeEach(() => {
    props = {
      protocolId: PROTOCOL_ID,
      setShowDeleteConfirmationModal: mockFunc,
    }
    when(vi.mocked(useHost)).calledWith().thenReturn(MOCK_HOST_CONFIG)
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID)
      .thenReturn({
        data: {
          data: {
            metadata: { protocolName: 'mockProtocol1' },
          },
        },
      } as any)
    when(vi.mocked(useToaster)).calledWith().thenReturn({
      makeSnackbar: mockMakeSnackbar,
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    })
    vi.mocked(useDeleteProtocolMutation).mockReturnValue({
      deleteProtocol: mockDeleteProtocol,
    } as any)
    mockDeleteProtocol.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Delete this protocol?')
    screen.getByText('and its run history will be permanently deleted.')
    screen.getByText('Cancel')
    screen.getByText('Delete')
  })

  it('should close the modal when tapping cancel button', () => {
    render(props)
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockFunc).toHaveBeenCalled()
  })

  it('should call a mock function when tapping delete button', async () => {
    when(vi.mocked(getProtocol))
      .calledWith(MOCK_HOST_CONFIG, PROTOCOL_ID)
      .thenResolve({
        data: { links: { referencingRuns: [{ id: '1' }, { id: '2' }] } },
      } as any)

    render(props)
    act(() => {
      screen.getByText('Delete').click()
    })
    await new Promise(setImmediate)
    expect(vi.mocked(deleteRun)).toHaveBeenCalledWith(MOCK_HOST_CONFIG, '1')
    expect(vi.mocked(deleteRun)).toHaveBeenCalledWith(MOCK_HOST_CONFIG, '2')
    expect(mockDeleteProtocol).toHaveBeenCalledWith(PROTOCOL_ID)
    expect(mockMakeSnackbar).toHaveBeenCalledWith('Protocol deleted')
  })
})
