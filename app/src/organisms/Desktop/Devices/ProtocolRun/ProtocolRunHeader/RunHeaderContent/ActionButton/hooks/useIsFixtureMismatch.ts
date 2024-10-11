import { useMostRecentCompletedAnalysis } from '/app/resources/runs'
import { useRobotType } from '/app/redux-resources/robots'
import {
  getIsFixtureMismatch,
  useDeckConfigurationCompatibility,
} from '/app/resources/deck_configuration'

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
