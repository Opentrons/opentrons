import { useCommandTextString } from '@opentrons/components'
import { useCommandQuery } from '@opentrons/react-api-client'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
  RobotType,
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
  currentCommandString: string
  previousCommandString: string
  stubStepFraction: string
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

  const currentCommandString = useCommandTextString({
    command: currentCommand ?? null,
    allRunDefs,
    commandTextData: protocolAnalysis,
    robotType,
  })

  const previousCommandString = useCommandTextString({
    command: previousCommand ?? null,
    allRunDefs,
    commandTextData: protocolAnalysis,
    robotType,
  })

  const stubTotalSteps = '100'
  const stubCurrentStep = '1'
  const stubStepFraction = `${stubCurrentStep}/${stubTotalSteps}`
  const isLoading = currentLoading || previousLoading

  return {
    currentCommandString:
      currentCommandString.commandText.length === 0
        ? '?'
        : currentCommandString.commandText,
    previousCommandString:
      previousCommandString.commandText.length === 0
        ? '?'
        : previousCommandString.commandText,
    stubStepFraction,
    isLoading,
  }
}
