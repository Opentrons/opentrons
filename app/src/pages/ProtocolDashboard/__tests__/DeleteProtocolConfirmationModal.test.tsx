import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { act, fireEvent, screen } from '@testing-library/react'

import {
  getProtocol,
  deleteProtocol,
  deleteRun,
  HostConfig,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import { useHost, useProtocolQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { useToaster } from '../../../organisms/ToasterOven'
import { DeleteProtocolConfirmationModal } from '../DeleteProtocolConfirmationModal'

jest.mock('@opentrons/api-client')
jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/ToasterOven')

const mockFunc = jest.fn()
const PROTOCOL_ID = 'mockProtocolId'
const mockMakeSnackbar = jest.fn()
const MOCK_HOST_CONFIG = {} as HostConfig
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockGetProtocol = getProtocol as jest.MockedFunction<typeof getProtocol>
const mockDeleteProtocol = deleteProtocol as jest.MockedFunction<
  typeof deleteProtocol
>
const mockDeleteRun = deleteRun as jest.MockedFunction<typeof deleteRun>
const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseToaster = useToaster as jest.MockedFunction<typeof useToaster>

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
  }
})

const render = (
  props: React.ComponentProps<typeof DeleteProtocolConfirmationModal>
) => {
  return renderWithProviders(<DeleteProtocolConfirmationModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeleteProtocolConfirmationModal', () => {
  let props: React.ComponentProps<typeof DeleteProtocolConfirmationModal>

  beforeEach(() => {
    props = {
      protocolId: PROTOCOL_ID,
      setShowDeleteConfirmationModal: mockFunc,
    }
    when(mockUseHost).calledWith().mockReturnValue(MOCK_HOST_CONFIG)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID)
      .mockReturnValue({
        data: {
          data: {
            metadata: { protocolName: 'mockProtocol1' },
          },
        },
      } as any)
    when(mockUseToaster).calledWith().mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      makeToast: jest.fn(),
      eatToast: jest.fn(),
    })
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
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
    when(mockGetProtocol)
      .calledWith(MOCK_HOST_CONFIG, PROTOCOL_ID)
      .mockResolvedValue({
        data: { links: { referencingRuns: [{ id: '1' }, { id: '2' }] } },
      } as any)

    render(props)
    act(() => {
      fireEvent.click(screen.getByText('Delete'))
    })
    await new Promise(setImmediate)
    expect(mockDeleteRun).toHaveBeenCalledWith(MOCK_HOST_CONFIG, '1')
    expect(mockDeleteRun).toHaveBeenCalledWith(MOCK_HOST_CONFIG, '2')
    expect(mockDeleteProtocol).toHaveBeenCalledWith(
      MOCK_HOST_CONFIG,
      PROTOCOL_ID
    )
    expect(mockMakeSnackbar).toHaveBeenCalledWith('Protocol deleted')
  })
})
