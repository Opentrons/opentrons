import { useQueryClient } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteProtocol, deleteRun, getProtocol } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { updateConfigValue } from '/app/redux/config'

import { useDeleteProtocols } from '../useDeleteProtocols'

import type { Mock } from 'vitest'
import type { HostConfig } from '@opentrons/api-client'

vi.mock('react-redux')
vi.mock('react-query')
vi.mock('@opentrons/api-client')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/config')

const MOCK_HOST_CONFIG = {} as HostConfig

describe('useDeleteProtocols', () => {
  let mockDispatch: Mock
  let mockInvalidateQueries: Mock

  beforeEach(() => {
    mockDispatch = vi.fn()
    mockInvalidateQueries = vi.fn().mockResolvedValue(undefined)

    vi.mocked(useHost).mockReturnValue(MOCK_HOST_CONFIG)
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
    vi.mocked(useSelector).mockReturnValue(['protocol1'])
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as any)

    vi.mocked(getProtocol).mockImplementation((_host, protocolId) =>
      Promise.resolve({
        data: {
          links: {
            referencingRuns:
              protocolId === 'protocol1'
                ? [{ id: 'run1' }, { id: 'run2' }]
                : [],
          },
        },
      } as any)
    )
    vi.mocked(deleteRun).mockResolvedValue({} as any)
    vi.mocked(deleteProtocol).mockResolvedValue({} as any)
  })

  it('deletes referencing runs before deleting each protocol', async () => {
    const { result } = renderHook(() => useDeleteProtocols())

    await act(async () => {
      await result.current.deleteProtocols(['protocol1', 'protocol2'])
    })

    expect(deleteRun).toHaveBeenCalledWith(MOCK_HOST_CONFIG, 'run1')
    expect(deleteRun).toHaveBeenCalledWith(MOCK_HOST_CONFIG, 'run2')
    expect(deleteProtocol).toHaveBeenCalledWith(MOCK_HOST_CONFIG, 'protocol1')
    expect(deleteProtocol).toHaveBeenCalledWith(MOCK_HOST_CONFIG, 'protocol2')
  })

  it('removes deleted protocol ids from the pinned protocols config', async () => {
    const { result } = renderHook(() => useDeleteProtocols())

    await act(async () => {
      await result.current.deleteProtocols(['protocol1'])
    })

    expect(updateConfigValue).toHaveBeenCalledWith(
      'protocols.pinnedProtocolIds',
      []
    )
    expect(mockDispatch).toHaveBeenCalled()
  })

  it('invalidates the protocols query after deleting', async () => {
    const { result } = renderHook(() => useDeleteProtocols())

    await act(async () => {
      await result.current.deleteProtocols(['protocol2'])
    })

    expect(mockInvalidateQueries).toHaveBeenCalled()
  })

  it('collects failed protocol ids without stopping the rest of the batch', async () => {
    vi.mocked(deleteProtocol).mockImplementation((_host, protocolId) =>
      protocolId === 'protocol2'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve({} as any)
    )

    const { result } = renderHook(() => useDeleteProtocols())

    let deleteResult: { failedIds: string[] } | undefined
    await act(async () => {
      deleteResult = await result.current.deleteProtocols([
        'protocol1',
        'protocol2',
      ])
    })

    expect(deleteResult?.failedIds).toEqual(['protocol2'])
    expect(deleteProtocol).toHaveBeenCalledWith(MOCK_HOST_CONFIG, 'protocol1')
  })
})
