import { useQueryClient } from 'react-query'
import isEqual from 'lodash/isEqual'

import {
  getQueryKey,
  useCreateProtocolAnalysisMutation,
  useCreateRunMutation,
  useHost,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import {
  getRunTimeParameterFilesForRun,
  getRunTimeParameterValuesForRun,
} from '/app/transformations/runs'

import { useNotifyRunQuery } from './useNotifyRunQuery'

import type { LabwareOffset, Run } from '@opentrons/api-client'

interface UseCloneRunResult {
  cloneRun: (options?: { onError?: (error: unknown) => void }) => void
  isLoadingRun: boolean
  isCloning: boolean
}

export function useCloneRun(
  runId: string | null,
  onSuccessCallback?: (createRunResponse: Run) => unknown,
  triggerAnalysis: boolean = false
): UseCloneRunResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const { data: runRecord, isLoading: isLoadingRun } = useNotifyRunQuery(runId)
  const protocolKey = runRecord?.data.protocolId ?? null
  const documentationState = useDocumentationState()
  const { createRun, isLoading: isCloning } = useCreateRunMutation(
    documentationState,
    {
      onSuccess: response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'protocols', protocolKey))
          .catch((e: Error) => {
            console.error(`error invalidating protocol query: ${e.message}`)
          })
        // The onSuccess callback is not awaited until query invalidation, because currently, in every instance this
        // onSuccessCallback is utilized, we only use it for navigating. We may need to revisit this.
        onSuccessCallback?.(response)
      },
    }
  )
  const { createProtocolAnalysis } = useCreateProtocolAnalysisMutation(
    protocolKey,
    host
  )
  const cloneRun = (options?: { onError?: (error: unknown) => void }): void => {
    if (runRecord != null) {
      const { protocolId, labwareOffsets } = runRecord.data
      const runTimeParameters =
        'runTimeParameters' in runRecord.data
          ? runRecord.data.runTimeParameters
          : []
      const runTimeParameterValues =
        getRunTimeParameterValuesForRun(runTimeParameters)
      const runTimeParameterFiles =
        getRunTimeParameterFilesForRun(runTimeParameters)
      if (triggerAnalysis && protocolKey != null) {
        createProtocolAnalysis({
          protocolKey,
          runTimeParameterValues,
          runTimeParameterFiles,
        })
      }
      createRun(
        {
          protocolId,
          labwareOffsets: mostRecentUniqueLabwareOffsets(labwareOffsets),
          runTimeParameterValues,
          runTimeParameterFiles,
        },
        {
          onError: error => {
            options?.onError?.(error)
          },
        }
      )
    } else {
      console.info('failed to clone run record, source run record not found')
    }
  }

  return { cloneRun, isLoadingRun, isCloning }
}

// Returns the most recent, unique offsets for each labware uri + location pair.
// Assumes the most recent labware offsets are appended to the end of the list.
function mostRecentUniqueLabwareOffsets(
  offsets: LabwareOffset[] | undefined
): LabwareOffset[] | undefined {
  return offsets?.filter((offset, index, array) => {
    return (
      array.findLastIndex(
        firstOffset =>
          isEqual(firstOffset.locationSequence, offset.locationSequence) &&
          isEqual(firstOffset.definitionUri, offset.definitionUri)
      ) === index
    )
  })
}
