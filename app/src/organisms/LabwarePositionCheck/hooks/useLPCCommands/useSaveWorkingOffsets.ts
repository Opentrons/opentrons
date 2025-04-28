import type { StoredLabwareOffset } from '@opentrons/api-client'
import {
  useCreateLabwareOffsetsMutation,
  useDeleteLabwareOffsetMutation,
} from '@opentrons/react-api-client'
import type { UseLPCCommandChildProps } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/types'
import { selectPendingOffsetOperations } from '/app/redux/protocol-runs'
import type { SavedOffsets } from '/app/redux/protocol-runs'
import { useState } from 'react'
import { useSelector } from 'react-redux'

export interface UseBuildOffsetsToApplyResult {
  // Update the server with the current working offsets, returning the updated offsets.
  saveWorkingOffsets: () => Promise<SavedOffsets>
  isSavingWorkingOffsetsLoading: boolean
}

export function useSaveWorkingOffsets({
  runId,
}: UseLPCCommandChildProps): UseBuildOffsetsToApplyResult {
  const [isLoading, setIsLoading] = useState(false)

  const { toUpdate, toDelete } = useSelector(
    selectPendingOffsetOperations(runId)
  )
  const { createLabwareOffsets } = useCreateLabwareOffsetsMutation()
  const { deleteLabwareOffset } = useDeleteLabwareOffsetMutation()

  const deleteLabwareOffsets = (): Promise<StoredLabwareOffset[]> => {
    if (toDelete.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      const deletePromises = toDelete.map(id => deleteLabwareOffset(id))
      return Promise.all(deletePromises)
    } else {
      return Promise.resolve([])
    }
  }

  const createNecessaryLabwareOffsets = (): Promise<StoredLabwareOffset[]> => {
    if (toUpdate.length > 0) {
      return createLabwareOffsets(toUpdate).then(res => {
        return Array.isArray(res) ? res : [res]
      })
    } else {
      return Promise.resolve([])
    }
  }

  const saveWorkingOffsets = (): Promise<SavedOffsets> => {
    setIsLoading(true)

    return Promise.all([
      createNecessaryLabwareOffsets(),
      deleteLabwareOffsets(),
    ])
      .then(res => {
        setIsLoading(false)

        return res
      })
      .catch(() => {
        setIsLoading(false)

        return [[], []]
      })
  }

  return {
    isSavingWorkingOffsetsLoading: isLoading,
    saveWorkingOffsets,
  }
}
