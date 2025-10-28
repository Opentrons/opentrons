import { useMemo } from 'react'
import { format } from 'date-fns'

import { getLabwareDefinitionsFromCommands } from '@opentrons/components'

import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useNotifyImageFileQuery } from '/app/resources/dataFiles/useNotifyImageFileQuery'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

const IMAGE_METADATA_POLL_MS = 5000

export interface UseImagesInfoItem {
  imageId: string
  stepCommandId: string
  previousStepCommandId: string
  timestamp: string
}

export interface UseImagesInfoResult {
  items: UseImagesInfoItem[]
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  isLoadingImages: boolean
  allRunDefs: LabwareDefinition[]
}

export function useImageInfo(runId: string): UseImagesInfoResult {
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const { data, isLoading } = useNotifyImageFileQuery(runId, {
    refetchInterval: IMAGE_METADATA_POLL_MS,
  })
  const isLoadingImages = isLoading || protocolAnalysis == null
  const isValidProtocolAnalysis = protocolAnalysis != null
  const allRunDefs = useMemo(
    () =>
      protocolAnalysis != null
        ? getLabwareDefinitionsFromCommands(protocolAnalysis.commands)
        : [],
    [isValidProtocolAnalysis]
  )
  const items = useMemo(() => {
    if (data == null) return []
    return data.data.map(img => ({
      imageId: img.id,
      stepCommandId: img.commandId ?? '',
      previousStepCommandId: img.prevCommandId ?? '',
      timestamp: format(new Date(String(img.createdAt)), 'M/d/yy HH:mm:ss'),
    }))
  }, [data])
  return { items, protocolAnalysis, isLoadingImages, allRunDefs }
}
