import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { act } from '@testing-library/react'

import {
  getProtocol,
  deleteProtocol,
  deleteRun,
  HostConfig,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { DeleteProtocolConfirmationModal } from '../DeleteProtocolConfirmationModal'

jest.mock('@opentrons/api-client')
jest.mock('@opentrons/react-api-client')

const mockFunc = jest.fn()

const MOCK_HOST_CONFIG = {} as HostConfig
const mockuseHost = useHost as jest.MockedFunction<typeof useHost>
const mockGetProtocol = getProtocol as jest.MockedFunction<typeof getProtocol>
const mockDeleteProtocol = deleteProtocol as jest.MockedFunction<
  typeof deleteProtocol
>
const mockDeleteRun = deleteRun as jest.MockedFunction<typeof deleteRun>

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
    when(mockuseHost).calledWith().mockReturnValue(MOCK_HOST_CONFIG)
    props = {
      protocolId: 'mockProtocol1',
      protocolName: 'mockProtocol1',
      setShowDeleteConfirmationModal: mockFunc,
    }
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should render text and buttons', () => {
    const { getByText } = render(props)
    getByText('Delete this protocol?')
    getByText('and its run history will be permanently deleted.')
    getByText('Cancel')
    getByText('Delete')
  })

  it('should close the modal when tapping cancel button', () => {
    const { getByText } = render(props)
    getByText('Cancel').click()
    expect(mockFunc).toHaveBeenCalled()
  })

  it('should call a mock function when tapping delete button', async () => {
    when(mockGetProtocol)
      .calledWith(MOCK_HOST_CONFIG, 'mockProtocol1')
      .mockResolvedValue({
        data: { links: { referencingRuns: [{ id: '1' }, { id: '2' }] } },
      } as any)

    const { getByText } = render(props)
    act(() => {
      getByText('Delete').click()
    })
    await new Promise(setImmediate)
    getByText('Delete').click()
    await new Promise(setImmediate)
    expect(mockDeleteRun).toHaveBeenCalledWith(MOCK_HOST_CONFIG, '1')
    expect(mockDeleteRun).toHaveBeenCalledWith(MOCK_HOST_CONFIG, '2')
    expect(mockDeleteProtocol).toHaveBeenCalledWith(
      MOCK_HOST_CONFIG,
      'mockProtocol1'
    )
  })
})
