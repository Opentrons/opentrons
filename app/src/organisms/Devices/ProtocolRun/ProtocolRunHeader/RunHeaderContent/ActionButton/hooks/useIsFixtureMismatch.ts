import { useMostRecentCompletedAnalysis } from '../../../../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useRobotType } from '../../../../../hooks'
import {
  getIsFixtureMismatch,
  useDeckConfigurationCompatibility,
} from '../../../../../../../resources/deck_configuration'

export function useIsFixtureMismatch(
  runId: string,
  robotName: string
): boolean {
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const robotType = useRobotType(robotName)
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    robotProtocolAnalysis
  )

  return getIsFixtureMismatch(deckConfigCompatibility)
}
