import { useCommandTextString } from '@opentrons/components'
import { useCommandQuery } from '@opentrons/react-api-client'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { UseImagesInfoItem } from '/app/resources/dataFiles/useImageInfo'

export interface UseImageGalleryDataProps {
  item: UseImagesInfoItem
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  runId: string
  robotType: RobotType
  allRunDefs: LabwareDefinition[]
}

export interface UseImageGalleryDataResult {
  currentCommand: RunTimeCommand | null
  currentCommandString: string
  previousCommandString: string
  isLoading: boolean
}

export function useImageGalleryData({
  item,
  protocolAnalysis,
  runId,
  robotType,
  allRunDefs,
}: UseImageGalleryDataProps): UseImageGalleryDataResult {
  const { stepCommandId, previousStepCommandId } = item

  const { data: currentCommandDetails, isLoading: currentLoading } =
    useCommandQuery(runId, stepCommandId)
  const { data: previousCommandDetails, isLoading: previousLoading } =
    useCommandQuery(runId, previousStepCommandId)

  const currentCommand = currentCommandDetails?.data
  const previousCommand = previousCommandDetails?.data
  const currentCommandAnalysis = protocolAnalysis?.commands.find(
    c => c.key === currentCommand?.key
  )
  const previousCommandAnalysis = protocolAnalysis?.commands.find(
    c => c.key === previousCommand?.key
  )

  const currentCommandString = useCommandTextString({
    command: currentCommandAnalysis ?? null,
    allRunDefs,
    commandTextData: protocolAnalysis,
    robotType,
  })

  const previousCommandString = useCommandTextString({
    command: previousCommandAnalysis ?? null,
    allRunDefs,
    commandTextData: protocolAnalysis,
    robotType,
  })

  const isLoading = currentLoading || previousLoading

  return {
    currentCommand: currentCommand ?? null,
    currentCommandString:
      currentCommandString.commandText.length === 0
        ? '?'
        : currentCommandString.commandText,
    previousCommandString:
      previousCommandString.commandText.length === 0
        ? '?'
        : previousCommandString.commandText,
    isLoading,
  }
}
