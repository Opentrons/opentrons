import { useMemo } from 'react'
import { format } from 'date-fns'

import { getLabwareDefinitionsFromCommands } from '@opentrons/components'
import { useImageFileQuery } from '@opentrons/react-api-client'

import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

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

export function useImageInfo(run_id: string): UseImagesInfoResult {
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(run_id)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(run_id)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const { data, isLoading, error } = useImageFileQuery(run_id)
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
    return data.data.map((img: any) => ({
      imageId: img.imageId,
      stepCommandId: img.commandId,
      previousStepCommandId: img.prevCommandId,
      timestamp: format(new Date(String(img.createdAt)), 'M/d/yy HH:mm:ss'),
    }))
  }, [data, isLoading, error])
  return { items, protocolAnalysis, isLoadingImages, allRunDefs }
}
