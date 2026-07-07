import { useState } from 'react'
import { useQueryClient } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'

import { deleteProtocol, deleteRun, getProtocol } from '@opentrons/api-client'
import { getQueryKey, useHost } from '@opentrons/react-api-client'

import { getPinnedProtocolIds, updateConfigValue } from '/app/redux/config'

import type { Dispatch } from '/app/redux/types'

interface DeleteProtocolsResult {
  failedIds: string[]
}

interface UseDeleteProtocolsResult {
  deleteProtocols: (protocolIds: string[]) => Promise<DeleteProtocolsResult>
  isDeleting: boolean
}

/**
 * Deletes one or more protocols from the robot, one at a time.
 *
 * For each protocol, this first deletes any runs that reference it (the
 * robot server rejects deleting a protocol that's still referenced by a
 * run), then deletes the protocol itself. If deleting one protocol fails,
 * the rest are still attempted; failed protocol ids are returned so the
 * caller can report them.
 */
export function useDeleteProtocols(): UseDeleteProtocolsResult {
  const host = useHost()
  const dispatch = useDispatch<Dispatch>()
  const queryClient = useQueryClient()
  const pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const deleteSingleProtocol = (protocolId: string): Promise<void> => {
    if (host == null) {
      return Promise.reject(
        new Error('could not delete protocol because the robot host is unknown')
      )
    }
    return getProtocol(host, protocolId)
      .then(
        response =>
          response.data.links?.referencingRuns.map(({ id }) => id) ?? []
      )
      .then(referencingRunIds =>
        Promise.all(referencingRunIds.map(runId => deleteRun(host, runId)))
      )
      .then(() => deleteProtocol(host, protocolId))
      .then(() => undefined)
  }

  const deleteProtocols = async (
    protocolIds: string[]
  ): Promise<DeleteProtocolsResult> => {
    setIsDeleting(true)
    const failedIds: string[] = []

    for (const protocolId of protocolIds) {
      try {
        await deleteSingleProtocol(protocolId)
      } catch (e) {
        console.error(
          `error deleting protocol ${protocolId}: ${(e as Error).message}`
        )
        failedIds.push(protocolId)
      }
    }

    const deletedIds = protocolIds.filter(id => !failedIds.includes(id))
    if (deletedIds.length > 0 && pinnedProtocolIds.length > 0) {
      const nextPinnedProtocolIds = pinnedProtocolIds.filter(
        id => !deletedIds.includes(id)
      )
      if (nextPinnedProtocolIds.length !== pinnedProtocolIds.length) {
        dispatch(
          updateConfigValue(
            'protocols.pinnedProtocolIds',
            nextPinnedProtocolIds
          )
        )
      }
    }

    if (host != null) {
      await queryClient
        .invalidateQueries(getQueryKey(host, 'protocols'))
        .catch((e: Error) => {
          console.error(`error invalidating protocols query: ${e.message}`)
        })
    }

    setIsDeleting(false)
    return { failedIds }
  }

  return { deleteProtocols, isDeleting }
}
