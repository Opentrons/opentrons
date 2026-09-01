import { usePostResetConfigMutation } from '@opentrons/react-api-client'

import { useTrackEvent } from '/app/redux/analytics'

import { useRestartRobotMutation } from './useRestartRobotMutation'

import type {
  DocumentationState,
  UsePostResetConfigMutationOptions,
  UsePostResetConfigMutationResult,
} from '@opentrons/react-api-client'

/**
 * Factory-reset robot config, then restart.
 */
export function useResetRobotConfigMutation(
  documentationState: DocumentationState,
  robotName: string,
  options: UsePostResetConfigMutationOptions = {}
): UsePostResetConfigMutationResult {
  const trackEvent = useTrackEvent()
  const { restart } = useRestartRobotMutation(documentationState, robotName)

  return usePostResetConfigMutation(documentationState, {
    ...options,
    onSuccess: (data, variables, context) => {
      trackEvent({
        name: 'resetRobotConfig',
        properties: { ...variables },
      })
      restart()
      options.onSuccess?.(data, variables, context)
    },
  })
}
